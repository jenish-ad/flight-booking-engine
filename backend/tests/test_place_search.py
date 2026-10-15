import httpx
import pytest

HEATHROW = {
    "type": "airport",
    "id": "arp_lhr_gb",
    "name": "Heathrow",
    "iata_code": "LHR",
    "iata_city_code": "LON",
    "iata_country_code": "GB",
    "icao_code": "EGLL",
    "city_name": "London",
    "time_zone": "Europe/London",
    "latitude": 51.470311,
    "longitude": -0.458118,
    # should get dropped since this is an airport
    "airports": [{"id": "arp_xxx", "name": "Stray", "iata_code": "XXX"}],
}
GATWICK = {
    "type": "airport",
    "id": "arp_lgw_gb",
    "name": "Gatwick",
    "iata_code": "LGW",
    "iata_city_code": "LON",
    "iata_country_code": "GB",
    "city_name": "London",
    "time_zone": "Europe/London",
}
LONDON = {
    "type": "city",
    "id": "cit_lon_gb",
    "name": "London",
    "iata_code": "LON",
    "iata_country_code": "GB",
    "airports": [HEATHROW, GATWICK],
}


def places_response(*places):
    return {"data": list(places)}


def counting_handler(payload):
    def handler(request):
        handler.calls += 1
        handler.request = request
        return httpx.Response(200, json=payload)

    handler.calls = 0
    return handler


def test_place_search_request_and_response(client_factory):
    handler = counting_handler(places_response(LONDON, HEATHROW))
    response = client_factory(handler, authenticated=False).get(
        "/places", params={"query": "lond"}
    )

    assert response.status_code == 200
    assert handler.request.method == "GET"
    assert (
        str(handler.request.url) == "https://duffel.test/places/suggestions?query=lond"
    )
    assert handler.request.headers["Authorization"] == "Bearer test-placeholder"
    assert handler.request.headers["Duffel-Version"] == "v2"

    city, airport = response.json()["places"]
    assert city["type"] == "city"
    assert city["iata_code"] == "LON"
    assert [a["iata_code"] for a in city["airports"]] == ["LHR", "LGW"]
    assert airport == {
        "type": "airport",
        "id": "arp_lhr_gb",
        "name": "Heathrow",
        "iata_code": "LHR",
        "iata_city_code": "LON",
        "iata_country_code": "GB",
        "city_name": "London",
        "time_zone": "Europe/London",
        "airports": [],
    }


def test_places_without_iata_code_are_dropped(client_factory):
    no_code = HEATHROW | {"id": "arp_none", "iata_code": None}
    city = LONDON | {"airports": [GATWICK, no_code]}
    handler = counting_handler(places_response(no_code, city))
    response = client_factory(handler).get("/places", params={"query": "lond"})

    assert response.status_code == 200
    [place] = response.json()["places"]
    assert [a["iata_code"] for a in place["airports"]] == ["LGW"]


def test_query_is_normalized_and_cached(client_factory, fake_cache):
    handler = counting_handler(places_response(HEATHROW))
    client = client_factory(handler)

    first = client.get("/places", params={"query": "  Heath   Row "})
    second = client.get("/places", params={"query": "heath row"})

    assert first.status_code == second.status_code == 200
    assert second.json() == first.json()
    assert handler.calls == 1
    assert handler.request.url.params["query"] == "heath row"
    assert fake_cache.ttls == {"places:search:v1:heath row": 24 * 60 * 60}


def test_empty_results_are_cached_briefly(client_factory, fake_cache):
    client_factory(counting_handler(places_response())).get(
        "/places", params={"query": "zzzz"}
    )
    assert fake_cache.ttls == {"places:search:v1:zzzz": 60 * 60}


def test_unreadable_cache_entry_is_a_miss(client_factory, fake_cache):
    fake_cache.data["places:search:v1:lond"] = "not valid json"
    handler = counting_handler(places_response(LONDON))

    response = client_factory(handler).get("/places", params={"query": "lond"})
    assert response.status_code == 200
    assert handler.calls == 1
    assert fake_cache.data["places:search:v1:lond"] != "not valid json"


@pytest.mark.parametrize("query", ["", "a", "   ", " a ", "x" * 51])
def test_invalid_query_is_rejected_without_calling_duffel(client_factory, query):
    handler = counting_handler(places_response())
    response = client_factory(handler).get("/places", params={"query": query})
    assert response.status_code == 422
    assert handler.calls == 0


def test_missing_query_is_rejected(client_factory):
    handler = counting_handler(places_response())
    assert client_factory(handler).get("/places").status_code == 422
    assert handler.calls == 0


@pytest.mark.parametrize(
    ("provider_status", "status"),
    [(400, 422), (422, 422), (401, 503), (429, 429), (500, 502)],
)
def test_provider_errors_are_mapped_and_not_cached(
    client_factory, fake_cache, provider_status, status
):
    response = client_factory(
        lambda _: httpx.Response(provider_status, json={"errors": []})
    ).get("/places", params={"query": "lond"})
    assert response.status_code == status
    assert fake_cache.data == {}


@pytest.mark.parametrize(
    "payload",
    [{}, {"data": None}, {"data": [{"iata_code": "LHR"}]}],
)
def test_invalid_provider_response(client_factory, payload):
    response = client_factory(lambda _: httpx.Response(200, json=payload)).get(
        "/places", params={"query": "lond"}
    )
    assert response.status_code == 502
    assert response.json()["detail"] == (
        "Duffel returned an invalid place search response."
    )


def test_missing_token_returns_503(client_factory):
    response = client_factory(counting_handler(places_response()), token="").get(
        "/places", params={"query": "lond"}
    )
    assert response.status_code == 503
