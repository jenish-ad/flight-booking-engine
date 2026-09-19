"""Exercise the API and real service with a simulated Duffel HTTP transport."""

import json
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_duffel_service
from app.api.routes.flights import router
from app.core.config import Settings
from app.services.duffel import DuffelService

SEARCH = {
    "origin": "SYD",
    "destination": "MEL",
    "departure_date": (
        datetime.now(timezone.utc).date() + timedelta(days=30)
    ).isoformat(),
    "adults": 2,
    "cabin_class": "economy",
}
AIRLINE = {"name": "Test Airways", "iata_code": "ZZ"}


def airport(code):
    return {"name": code, "iata_code": code, "time_zone": "Australia/Sydney"}


def segment(origin, destination):
    return {
        "origin": airport(origin),
        "destination": airport(destination),
        "departing_at": "2026-10-20T10:00:00",
        "arriving_at": "2026-10-20T11:30:00",
        "marketing_carrier": AIRLINE,
        "operating_carrier": AIRLINE,
        "marketing_carrier_flight_number": "123",
        "stops": [],
    }


def provider_response(segments=None):
    return {
        "data": {
            "id": "orq_test",
            "offers": [
                {
                    "id": "off_test",
                    "owner": AIRLINE,
                    "total_amount": "123.45",
                    "total_currency": "AUD",
                    "expires_at": "2026-10-01T12:00:00Z",
                    "slices": [{"segments": segments or [segment("SYD", "MEL")]}],
                }
            ],
        }
    }


@pytest.fixture
def client_factory():
    clients = []

    def make(handler, token="test-placeholder"):
        app = FastAPI()
        app.include_router(router)

        async def service():
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                yield DuffelService(Settings(duffel_access_token=token), client)

        app.dependency_overrides[get_duffel_service] = service
        client = TestClient(app)
        clients.append(client)
        return client

    yield make
    for client in clients:
        client.close()


def test_search_request_and_response(client_factory):
    def handler(request):
        assert request.method == "POST"
        assert (
            str(request.url)
            == "https://api.duffel.com/air/offer_requests?return_offers=true"
        )
        for key, value in {
            "Authorization": "Bearer test-placeholder",
            "Duffel-Version": "v2",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip",
        }.items():
            assert request.headers[key] == value
        assert json.loads(request.content) == {
            "data": {
                "slices": [
                    {
                        key: SEARCH[key]
                        for key in ("origin", "destination", "departure_date")
                    }
                ],
                "passengers": [{"type": "adult"}, {"type": "adult"}],
                "cabin_class": "economy",
            }
        }
        return httpx.Response(201, json=provider_response())

    response = client_factory(handler).post("/flights/search", json=SEARCH)
    assert response.status_code == 200
    offer = response.json()["offers"][0]
    assert offer["id"] == "off_test"
    assert offer["airline"] == AIRLINE
    assert offer["total_amount"] == "123.45"
    assert offer["total_currency"] == "AUD"
    flight_slice = offer["slices"][0]
    assert flight_slice["stops"] == 0
    assert flight_slice["origin"]["iata_code"] == "SYD"
    assert flight_slice["destination"]["iata_code"] == "MEL"
    assert flight_slice["segments"][0]["flight_number"] == "123"
    assert "test-placeholder" not in response.text


def test_connections_and_intermediate_stops(client_factory):
    segments = [segment("SYD", "BNE"), segment("BNE", "MEL")]
    segments[0]["stops"] = [{"airport": airport("CBR")}]
    response = client_factory(
        lambda _: httpx.Response(201, json=provider_response(segments))
    ).post("/flights/search", json=SEARCH)
    flight_slice = response.json()["offers"][0]["slices"][0]
    assert flight_slice["stops"] == 2
    assert len(flight_slice["segments"]) == 2


@pytest.mark.parametrize(
    "payload",
    [
        {"data": {"id": "orq_test", "offers": []}},
        {},
        {"data": {"id": "orq_test", "offers": None}},
    ],
)
def test_empty_and_malformed_results(client_factory, payload):
    response = client_factory(lambda _: httpx.Response(200, json=payload)).post(
        "/flights/search", json=SEARCH
    )
    if payload.get("data", {}).get("offers") == []:
        assert response.status_code == 200
        assert response.json()["offers"] == []
    else:
        assert response.status_code == 502


@pytest.mark.parametrize(
    "upstream, expected",
    [
        (400, 422),
        (422, 422),
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
    ).post("/flights/search", json=SEARCH)
    assert response.status_code == expected
    assert "test-placeholder" not in response.text
    assert response.json()["detail"]


@pytest.mark.parametrize(
    "error, expected", [(httpx.ReadTimeout, 504), (httpx.ConnectError, 502)]
)
def test_transport_errors(client_factory, error, expected):
    def handler(request):
        raise error("sensitive provider details", request=request)

    response = client_factory(handler).post("/flights/search", json=SEARCH)
    assert response.status_code == expected
    assert "sensitive" not in response.text


def test_missing_token(client_factory):
    def handler(request):
        pytest.fail("No request should be sent without a token")

    response = client_factory(handler, token="").post("/flights/search", json=SEARCH)
    assert response.status_code == 503
    assert "DUFFEL_ACCESS_TOKEN" in response.json()["detail"]


@pytest.mark.parametrize(
    "changes",
    [
        {"origin": "INVALID"},
        {"destination": "SYD"},
        {"adults": 0},
        {"adults": 10},
        {"adults": True},
        {"cabin_class": "cargo"},
        {"departure_date": "2000-01-01"},
        {"departure_date": "invalid"},
    ],
)
def test_invalid_input(client_factory, changes):
    def handler(request):
        pytest.fail("Invalid input should not reach Duffel")

    assert (
        client_factory(handler)
        .post("/flights/search", json=SEARCH | changes)
        .status_code
        == 422
    )


def test_non_json_success(client_factory):
    response = client_factory(lambda _: httpx.Response(200, text="not JSON")).post(
        "/flights/search", json=SEARCH
    )
    assert response.status_code == 502
