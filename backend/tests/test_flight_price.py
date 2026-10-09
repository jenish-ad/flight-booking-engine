from datetime import datetime, timedelta, timezone

import httpx
import pytest

AIRLINE = {"name": "Test Airways", "iata_code": "ZZ"}
PRICE_URL = "/offers/off_test/price"
PRICE = {
    "expected_amount": "123.45",
    "expected_currency": "AUD",
}


def airport(code):
    return {"name": code, "iata_code": code, "time_zone": "Australia/Sydney"}


def provider_offer(**changes):
    offer = {
        "id": "off_test",
        "passengers": [{"id": "pas_first", "type": "adult"}],
        "owner": AIRLINE,
        "total_amount": "123.45",
        "total_currency": "AUD",
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=20)).isoformat(),
        "passenger_identity_documents_required": True,
        "payment_requirements": {
            "requires_instant_payment": False,
            "price_guarantee_expires_at": "2026-10-02T12:00:00Z",
        },
        "slices": [
            {
                "id": "sli_test",
                "segments": [
                    {
                        "id": "seg_test",
                        "origin": airport("SYD"),
                        "destination": airport("MEL"),
                        "departing_at": "2026-10-20T10:00:00",
                        "arriving_at": "2026-10-20T11:30:00",
                        "marketing_carrier": AIRLINE,
                        "operating_carrier": AIRLINE,
                        "marketing_carrier_flight_number": "123",
                        "stops": [],
                    }
                ],
            }
        ],
    }
    return {"data": offer | changes}


def test_price_request_and_unchanged_price(client_factory):
    def handler(request):
        assert request.method == "GET"
        assert str(request.url) == "https://duffel.test/air/offers/off_test"
        for key, value in {
            "Authorization": "Bearer test-placeholder",
            "Duffel-Version": "v2",
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
        }.items():
            assert request.headers[key] == value
        assert request.content == b""
        return httpx.Response(200, json=provider_offer())

    response = client_factory(handler).post(PRICE_URL, json=PRICE)
    assert response.status_code == 200
    body = response.json()
    assert body["price_changed"] is False
    assert body["previous_amount"] == "123.45"
    assert body["previous_currency"] == "AUD"
    assert body["offer"]["id"] == "off_test"
    assert body["offer"]["passengers"] == [{"id": "pas_first", "type": "adult"}]
    assert body["offer"]["total_amount"] == "123.45"
    assert body["offer"]["slices"][0]["segments"][0]["flight_number"] == "123"
    assert body["requires_instant_payment"] is False
    assert body["price_guaranteed_until"] == "2026-10-02T12:00:00Z"
    assert body["passenger_identity_documents_required"] is True
    assert "test-placeholder" not in response.text


@pytest.mark.parametrize(
    "changes",
    [
        {"expected_amount": "123.4500"},
        {"expected_amount": 123.45},
        {"expected_currency": "aud"},
    ],
)
def test_equivalent_expected_price_is_unchanged(client_factory, changes):
    response = client_factory(
        lambda _: httpx.Response(200, json=provider_offer())
    ).post(PRICE_URL, json=PRICE | changes)
    assert response.status_code == 200
    assert response.json()["price_changed"] is False


@pytest.mark.parametrize(
    "provider_changes",
    [{"total_amount": "150.00"}, {"total_currency": "USD"}],
)
def test_changed_price(client_factory, provider_changes):
    response = client_factory(
        lambda _: httpx.Response(200, json=provider_offer(**provider_changes))
    ).post(PRICE_URL, json=PRICE)
    assert response.status_code == 200
    body = response.json()
    assert body["price_changed"] is True
    assert body["previous_amount"] == "123.45"
    assert body["previous_currency"] == "AUD"
    assert (
        body["offer"]["total_amount"]
        == provider_offer(**provider_changes)["data"]["total_amount"]
    )


def test_missing_payment_requirements_defaults_to_instant_payment(client_factory):
    payload = provider_offer()
    del payload["data"]["payment_requirements"]
    del payload["data"]["passenger_identity_documents_required"]
    response = client_factory(lambda _: httpx.Response(200, json=payload)).post(
        PRICE_URL, json=PRICE
    )
    assert response.status_code == 200
    body = response.json()
    assert body["requires_instant_payment"] is True
    assert body["price_guaranteed_until"] is None
    assert body["passenger_identity_documents_required"] is False


@pytest.mark.parametrize("passengers", [None, [], [{"id": "invalid"}], [{}]])
def test_invalid_passenger_references(client_factory, passengers):
    response = client_factory(
        lambda _: httpx.Response(200, json=provider_offer(passengers=passengers))
    ).post(PRICE_URL, json=PRICE)
    assert response.status_code == 502


def test_expired_offer(client_factory):
    expired = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    response = client_factory(
        lambda _: httpx.Response(200, json=provider_offer(expires_at=expired))
    ).post(PRICE_URL, json=PRICE)
    assert response.status_code == 410
    assert "expired" in response.json()["detail"]


@pytest.mark.parametrize(
    "upstream, expected",
    [
        (400, 410),
        (404, 410),
        (410, 410),
        (422, 410),
        (401, 503),
        (403, 503),
        (429, 429),
        (500, 502),
        (302, 502),
    ],
)
def test_provider_errors_do_not_leak_secrets(client_factory, upstream, expected):
    response = client_factory(
        lambda _: httpx.Response(upstream, text="test-placeholder")
    ).post(PRICE_URL, json=PRICE)
    assert response.status_code == expected
    assert "test-placeholder" not in response.text
    assert response.json()["detail"]


@pytest.mark.parametrize(
    "error, expected", [(httpx.ReadTimeout, 504), (httpx.ConnectError, 502)]
)
def test_transport_errors(client_factory, error, expected):
    def handler(request):
        raise error("sensitive provider details", request=request)

    response = client_factory(handler).post(PRICE_URL, json=PRICE)
    assert response.status_code == expected
    assert "sensitive" not in response.text


def test_missing_token(client_factory):
    def handler(request):
        pytest.fail("No request should be sent without a token")

    response = client_factory(handler, token="").post(PRICE_URL, json=PRICE)
    assert response.status_code == 503
    assert "DUFFEL_ACCESS_TOKEN" in response.json()["detail"]


@pytest.mark.parametrize(
    "changes",
    [
        {"expected_amount": "-1"},
        {"expected_amount": "abc"},
        {"expected_currency": "AU"},
        {"expected_currency": "A1D"},
    ],
)
def test_invalid_input(client_factory, changes):
    def handler(request):
        pytest.fail("Invalid input should not reach Duffel")

    assert (
        client_factory(handler).post(PRICE_URL, json=PRICE | changes).status_code == 422
    )


@pytest.mark.parametrize("offer_id", ["ord_test", "off_", "off_test%2F..%2Forders"])
def test_invalid_offer_id(client_factory, offer_id):
    def handler(request):
        pytest.fail("Invalid input should not reach Duffel")

    response = client_factory(handler).post(f"/offers/{offer_id}/price", json=PRICE)
    assert response.status_code in (404, 422)


@pytest.mark.parametrize(
    "payload",
    [{}, {"data": None}, {"data": {"id": "off_test"}}],
)
def test_malformed_offer(client_factory, payload):
    response = client_factory(lambda _: httpx.Response(200, json=payload)).post(
        PRICE_URL, json=PRICE
    )
    assert response.status_code == 502


def test_non_json_success(client_factory):
    response = client_factory(lambda _: httpx.Response(200, text="not JSON")).post(
        PRICE_URL, json=PRICE
    )
    assert response.status_code == 502
