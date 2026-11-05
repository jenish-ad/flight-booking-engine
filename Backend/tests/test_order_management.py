import json
import uuid

import httpx
import pytest

from tests.test_flight_order import ORDER, provider_order

OTHER_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
CANCELLATION = {
    "id": "ore_test",
    "order_id": "ord_test",
    "refund_amount": "90.80",
    "refund_currency": "AUD",
    "refund_to": "balance",
    "expires_at": "2026-10-05T10:00:00Z",
    "confirmed_at": None,
}


def unexpected_request(request):
    raise AssertionError("Duffel should not be called")


def duffel(**routes):
    """Mock Duffel: routes maps "METHOD /path" to a response."""
    calls = []

    def handler(request):
        key = f"{request.method} {request.url.path}"
        calls.append((key, request.content))
        if key not in routes:
            raise AssertionError(f"Unexpected Duffel call: {key}")
        return routes[key]

    handler.calls = calls
    return handler


def book(client_factory, **kwargs):
    handler = duffel(**{"POST /air/orders": httpx.Response(201, json=provider_order())})
    response = client_factory(handler, **kwargs).post("/orders", json=ORDER)
    assert response.status_code == 201


def test_get_own_order(client_factory):
    book(client_factory)
    handler = duffel(
        **{"GET /air/orders/ord_test": httpx.Response(200, json=provider_order())}
    )
    response = client_factory(handler).get("/orders/ord_test")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "ord_test"
    assert body["booking_reference"] == "ABC123"
    assert body["cancelled_at"] is None


def test_other_users_order_is_not_found(client_factory):
    book(client_factory)
    client = client_factory(unexpected_request, user_id=OTHER_USER_ID)
    assert client.get("/orders/ord_test").status_code == 404
    assert client.post("/orders/ord_test/cancellations").status_code == 404
    assert (
        client.post("/orders/ord_test/cancellations/ore_test/confirm").status_code
        == 404
    )


def test_unknown_order_is_not_found(client_factory):
    response = client_factory(unexpected_request).get("/orders/ord_missing")
    assert response.status_code == 404


@pytest.mark.parametrize("order_id", ["off_test", "ord_", "order_1"])
def test_invalid_order_id(client_factory, order_id):
    response = client_factory(unexpected_request).get(f"/orders/{order_id}")
    assert response.status_code == 422


def test_order_routes_require_login(client_factory):
    client = client_factory(unexpected_request, authenticated=False)
    assert client.get("/orders/ord_test").status_code == 401
    assert client.post("/orders/ord_test/cancellations").status_code == 401


def test_cancel_order(client_factory):
    book(client_factory)
    handler = duffel(
        **{
            "POST /air/order_cancellations": httpx.Response(
                201, json={"data": CANCELLATION}
            ),
            "POST /air/order_cancellations/ore_test/actions/confirm": httpx.Response(
                200,
                json={"data": CANCELLATION | {"confirmed_at": "2026-10-05T09:30:00Z"}},
            ),
        }
    )
    client = client_factory(handler)

    quote = client.post("/orders/ord_test/cancellations")
    assert quote.status_code == 201
    assert quote.json()["id"] == "ore_test"
    assert quote.json()["refund_amount"] == "90.80"
    assert json.loads(handler.calls[0][1]) == {"data": {"order_id": "ord_test"}}

    confirmed = client.post("/orders/ord_test/cancellations/ore_test/confirm")
    assert confirmed.status_code == 200
    assert confirmed.json()["confirmed_at"] is not None

    # Already cancelled: neither step reaches Duffel again.
    assert len(handler.calls) == 2
    assert client.post("/orders/ord_test/cancellations").status_code == 409
    assert (
        client.post("/orders/ord_test/cancellations/ore_test/confirm").status_code
        == 409
    )
    assert len(handler.calls) == 2


def test_confirm_requires_latest_quote(client_factory):
    book(client_factory)
    client = client_factory(
        duffel(
            **{
                "POST /air/order_cancellations": httpx.Response(
                    201, json={"data": CANCELLATION}
                )
            }
        )
    )
    # No quote requested yet.
    assert (
        client.post("/orders/ord_test/cancellations/ore_test/confirm").status_code
        == 404
    )
    client.post("/orders/ord_test/cancellations")
    # A quote that wasn't issued for this order.
    assert (
        client.post("/orders/ord_test/cancellations/ore_other/confirm").status_code
        == 404
    )


def test_failed_confirm_leaves_order_active(client_factory):
    book(client_factory)
    handler = duffel(
        **{
            "POST /air/order_cancellations": httpx.Response(
                201, json={"data": CANCELLATION}
            ),
            "POST /air/order_cancellations/ore_test/actions/confirm": httpx.Response(
                422, json={"errors": [{"title": "secret"}]}
            ),
        }
    )
    client = client_factory(handler)
    client.post("/orders/ord_test/cancellations")

    response = client.post("/orders/ord_test/cancellations/ore_test/confirm")
    assert response.status_code == 409
    assert "secret" not in response.text
    # Still not cancelled, so a new quote can be requested.
    assert client.post("/orders/ord_test/cancellations").status_code == 201


@pytest.mark.parametrize(
    ("provider_status", "expected_status"),
    [(422, 409), (404, 409), (500, 502), (401, 503)],
)
def test_cancellation_provider_errors_are_mapped(
    client_factory, provider_status, expected_status
):
    book(client_factory)
    handler = duffel(
        **{
            "POST /air/order_cancellations": httpx.Response(
                provider_status, json={"errors": [{"title": "secret"}]}
            )
        }
    )
    response = client_factory(handler).post("/orders/ord_test/cancellations")
    assert response.status_code == expected_status
    assert "secret" not in response.text


@pytest.mark.parametrize(
    ("provider_status", "expected_status"), [(404, 404), (500, 502), (401, 503)]
)
def test_get_order_provider_errors_are_mapped(
    client_factory, provider_status, expected_status
):
    book(client_factory)
    handler = duffel(
        **{
            "GET /air/orders/ord_test": httpx.Response(
                provider_status, json={"errors": [{"title": "secret"}]}
            )
        }
    )
    response = client_factory(handler).get("/orders/ord_test")
    assert response.status_code == expected_status
    assert "secret" not in response.text
