import json

import httpx
import pytest

AIRLINE = {"name": "Test Airways", "iata_code": "ZZ"}
PASSENGER = {
    "id": "pas_first",
    "title": "ms",
    "gender": "f",
    "given_name": "Jane",
    "family_name": "Doe",
    "born_on": "1990-05-15",
    "email": "jane.doe@example.com",
    "phone_number": "+61400000000",
}
ORDER = {
    "offer_id": "off_test",
    "passengers": [PASSENGER],
    "amount": "123.45",
    "currency": "AUD",
}


def airport(code):
    return {"name": code, "iata_code": code, "time_zone": "Australia/Sydney"}


def provider_order(**changes):
    order = {
        "id": "ord_test",
        "booking_reference": "ABC123",
        "total_amount": "123.45",
        "total_currency": "AUD",
        "created_at": "2026-10-05T09:00:00Z",
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
    return {"data": order | changes}


def unexpected_request(request):
    raise AssertionError("Duffel should not be called")


def test_order_request_and_response(client_factory):
    def handler(request):
        assert request.method == "POST"
        assert str(request.url) == "https://duffel.test/air/orders"
        assert request.headers["Authorization"] == "Bearer test-placeholder"
        assert json.loads(request.content) == {
            "data": {
                "type": "instant",
                "selected_offers": ["off_test"],
                "passengers": [PASSENGER],
                "payments": [
                    {"type": "balance", "amount": "123.45", "currency": "AUD"}
                ],
            }
        }
        return httpx.Response(201, json=provider_order())

    response = client_factory(handler).post("/flights/order", json=ORDER)
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "ord_test"
    assert body["booking_reference"] == "ABC123"
    assert body["total_amount"] == "123.45"
    assert body["total_currency"] == "AUD"
    assert body["slices"][0]["stops"] == 0
    assert body["slices"][0]["segments"][0]["flight_number"] == "123"
    assert "test-placeholder" not in response.text


@pytest.mark.parametrize(
    "changes",
    [
        {"id": "passenger_1"},
        {"title": "sir"},
        {"gender": "x"},
        {"given_name": "   "},
        {"born_on": "2999-01-01"},
        {"email": "not-an-email"},
        {"phone_number": "0412 345 678"},
    ],
)
def test_invalid_passenger_is_rejected(client_factory, changes):
    order = ORDER | {"passengers": [PASSENGER | changes]}
    response = client_factory(unexpected_request).post("/flights/order", json=order)
    assert response.status_code == 422


@pytest.mark.parametrize(
    "changes",
    [
        {"offer_id": "offer_1"},
        {"passengers": []},
        {"passengers": [PASSENGER, PASSENGER]},
        {"amount": "-1"},
        {"currency": "AU"},
    ],
)
def test_invalid_order_is_rejected(client_factory, changes):
    response = client_factory(unexpected_request).post(
        "/flights/order", json=ORDER | changes
    )
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("provider_status", "expected_status"),
    [(400, 409), (404, 409), (410, 409), (422, 409), (500, 502), (401, 503)],
)
def test_provider_errors_are_mapped(client_factory, provider_status, expected_status):
    def handler(request):
        return httpx.Response(provider_status, json={"errors": [{"title": "secret"}]})

    response = client_factory(handler).post("/flights/order", json=ORDER)
    assert response.status_code == expected_status
    assert "secret" not in response.text


def test_invalid_provider_response(client_factory):
    def handler(request):
        return httpx.Response(201, json={"data": {"id": "ord_test"}})

    response = client_factory(handler).post("/flights/order", json=ORDER)
    assert response.status_code == 502
