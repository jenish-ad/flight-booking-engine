import json

import httpx
import pytest

from tests.test_flight_order import ORDER, provider_order

SEAT_MAPS_PATH = "/offers/off_test/seat-maps"
SEAT_MAPS_URL = "https://duffel.test/air/seat_maps?offer_id=off_test"


def seat(designator, *services):
    return {
        "type": "seat",
        "designator": designator,
        "name": "Window seat",
        "disclosures": ["Extra legroom"],
        "available_services": list(services),
    }


def seat_service(service_id, passenger_id="pas_first", amount="15.00", currency="AUD"):
    return {
        "id": service_id,
        "passenger_id": passenger_id,
        "total_amount": amount,
        "total_currency": currency,
    }


def seat_map(segment_id, *elements):
    return {
        "id": f"sea_{segment_id}",
        "slice_id": "sli_test",
        "segment_id": segment_id,
        "cabins": [
            {
                "cabin_class": "economy",
                "deck": 0,
                "aisles": 1,
                "wings": {"first_row_index": 0, "last_row_index": 1},
                "rows": [
                    {"sections": [{"elements": list(elements)}]},
                    {"sections": [{"elements": [{"type": "exit_row"}]}]},
                ],
            }
        ],
    }


SEAT_MAPS = {
    "data": [
        seat_map(
            "seg_first",
            seat("12A", seat_service("ase_12a")),
            seat("12B"),
            seat("12C", seat_service("ase_12c", amount="0.00")),
        ),
        seat_map("seg_second", seat("3F", seat_service("ase_3f", amount="9.50"))),
    ]
}


def unexpected_request(request):
    raise AssertionError("Duffel should not be called")


def test_seat_maps_request_and_response(client_factory):
    def handler(request):
        assert request.method == "GET"
        assert str(request.url) == SEAT_MAPS_URL
        return httpx.Response(200, json=SEAT_MAPS)

    response = client_factory(handler).get(SEAT_MAPS_PATH)
    assert response.status_code == 200
    body = response.json()
    assert body["offer_id"] == "off_test"
    assert [m["segment_id"] for m in body["seat_maps"]] == ["seg_first", "seg_second"]

    cabin = body["seat_maps"][0]["cabins"][0]
    assert cabin["wings"] == {"first_row_index": 0, "last_row_index": 1}
    seats = cabin["rows"][0]["sections"][0]
    assert seats[0]["designator"] == "12A"
    assert seats[0]["disclosures"] == ["Extra legroom"]
    assert seats[0]["available_services"] == [
        {
            "id": "ase_12a",
            "passenger_id": "pas_first",
            "total_amount": "15.00",
            "total_currency": "AUD",
        }
    ]
    assert seats[1]["available_services"] == []
    assert cabin["rows"][1]["sections"][0] == [
        {
            "type": "exit_row",
            "designator": None,
            "name": None,
            "disclosures": [],
            "available_services": [],
        }
    ]


def test_airline_without_seat_selection(client_factory):
    client = client_factory(lambda _: httpx.Response(200, json={"data": []}))
    response = client.get(SEAT_MAPS_PATH)
    assert response.status_code == 200
    assert response.json()["seat_maps"] == []


@pytest.mark.parametrize("offer_id", ["offer_1", "ord_test", "off_"])
def test_invalid_offer_id(client_factory, offer_id):
    response = client_factory(unexpected_request).get(f"/offers/{offer_id}/seat-maps")
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("provider_status", "expected_status"),
    [(400, 410), (404, 410), (422, 410), (500, 502), (401, 503), (429, 429)],
)
def test_provider_errors_are_mapped(client_factory, provider_status, expected_status):
    def handler(request):
        return httpx.Response(provider_status, json={"errors": [{"title": "secret"}]})

    response = client_factory(handler).get(SEAT_MAPS_PATH)
    assert response.status_code == expected_status
    assert "secret" not in response.text


def test_invalid_provider_response(client_factory):
    client = client_factory(
        lambda _: httpx.Response(200, json={"data": [{"id": "sea_test"}]})
    )
    response = client.get(SEAT_MAPS_PATH)
    assert response.status_code == 502


def test_seat_maps_require_login(client_factory):
    client = client_factory(unexpected_request, authenticated=False)
    response = client.get(SEAT_MAPS_PATH)
    assert response.status_code == 401


def test_order_with_seats_adds_seat_prices(client_factory):
    def handler(request):
        if request.method == "GET":
            assert str(request.url) == SEAT_MAPS_URL
            return httpx.Response(200, json=SEAT_MAPS)
        payload = json.loads(request.content)["data"]
        assert payload["services"] == [
            {"id": "ase_12a", "quantity": 1},
            {"id": "ase_3f", "quantity": 1},
        ]
        assert payload["payments"] == [
            {"type": "balance", "amount": "147.95", "currency": "AUD"}
        ]
        return httpx.Response(201, json=provider_order(total_amount="147.95"))

    response = client_factory(handler).post(
        "/orders", json=ORDER | {"services": ["ase_12a", "ase_3f"]}
    )
    assert response.status_code == 201
    assert response.json()["total_amount"] == "147.95"


@pytest.mark.parametrize(
    ("services", "seat_maps", "expected_status"),
    [
        (["ase_gone"], SEAT_MAPS, 409),
        (["ase_12a", "ase_12c"], SEAT_MAPS, 422),
        (
            ["ase_other"],
            {
                "data": [
                    seat_map(
                        "seg_first", seat("1A", seat_service("ase_other", "pas_other"))
                    )
                ]
            },
            422,
        ),
        (
            ["ase_usd"],
            {
                "data": [
                    seat_map(
                        "seg_first", seat("1A", seat_service("ase_usd", currency="USD"))
                    )
                ]
            },
            409,
        ),
    ],
    ids=["unavailable", "two-seats-one-flight", "other-passenger", "currency"],
)
def test_invalid_seat_selection(client_factory, services, seat_maps, expected_status):
    def handler(request):
        assert request.method == "GET", "Order should not be created"
        return httpx.Response(200, json=seat_maps)

    response = client_factory(handler).post(
        "/orders", json=ORDER | {"services": services}
    )
    assert response.status_code == expected_status


@pytest.mark.parametrize("services", [["seat_12a"], ["ase_12a", "ase_12a"], "ase_12a"])
def test_invalid_services_are_rejected(client_factory, services):
    response = client_factory(unexpected_request).post(
        "/orders", json=ORDER | {"services": services}
    )
    assert response.status_code == 422


def test_order_without_seats_skips_seat_maps(client_factory):
    def handler(request):
        assert request.method == "POST"
        assert "services" not in json.loads(request.content)["data"]
        return httpx.Response(201, json=provider_order())

    response = client_factory(handler).post("/orders", json=ORDER)
    assert response.status_code == 201
