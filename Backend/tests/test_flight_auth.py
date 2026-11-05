import httpx
import pytest

from tests.test_flight_order import ORDER
from tests.test_flight_price import PRICE, PRICE_URL
from tests.test_flight_search import SEARCH


def unexpected_request(request):
    raise AssertionError("Duffel should not be called")


@pytest.mark.parametrize(("path", "body"), [(PRICE_URL, PRICE), ("/orders", ORDER)])
def test_booking_routes_require_login(client_factory, path, body):
    client = client_factory(unexpected_request, authenticated=False)
    response = client.post(path, json=body)
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_search_is_public(client_factory):
    def handler(request):
        return httpx.Response(
            200,
            json={
                "data": {
                    "id": "orq_test",
                    "passengers": [{"id": "pas_1"}],
                    "offers": [],
                }
            },
        )

    response = client_factory(handler, authenticated=False).post(
        "/flights/search", json=SEARCH
    )
    assert response.status_code == 200
