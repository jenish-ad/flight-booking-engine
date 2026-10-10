import asyncio
from datetime import datetime, timedelta, timezone

import httpx
import pytest

from app.services.cache import RedisCache
from tests.test_flight_search import SEARCH, provider_response


def unexpected_request(request):
    raise AssertionError("Duffel should not be called")


def response_expiring_in(minutes):
    payload = provider_response()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload["data"]["offers"][0]["expires_at"] = expires_at.isoformat()
    return payload


def counting_handler(payload):
    def handler(request):
        handler.calls += 1
        return httpx.Response(200, json=payload)

    handler.calls = 0
    return handler


def test_repeat_search_is_served_from_cache(client_factory, fake_cache):
    handler = counting_handler(response_expiring_in(30))
    first = client_factory(handler).post("/flights/search", json=SEARCH)
    assert first.status_code == 200
    assert handler.calls == 1

    second = client_factory(unexpected_request).post("/flights/search", json=SEARCH)
    assert second.status_code == 200
    assert second.json() == first.json()


@pytest.mark.parametrize(
    "changes",
    [
        {"adults": 1},
        {"cabin_class": "business"},
        {"destination": "BNE"},
        {
            "departure_date": (
                datetime.now(timezone.utc).date() + timedelta(days=31)
            ).isoformat()
        },
    ],
)
def test_different_search_is_not_served_from_cache(client_factory, changes):
    handler = counting_handler(response_expiring_in(30))
    client = client_factory(handler)
    client.post("/flights/search", json=SEARCH)
    client.post("/flights/search", json=SEARCH | changes)
    assert handler.calls == 2


def test_cache_expires_before_first_offer(client_factory, fake_cache):
    client_factory(counting_handler(response_expiring_in(30))).post(
        "/flights/search", json=SEARCH
    )
    assert list(fake_cache.ttls.values()) == [300]

    fake_cache.ttls.clear()
    fake_cache.data.clear()
    client_factory(counting_handler(response_expiring_in(3))).post(
        "/flights/search", json=SEARCH
    )
    # 3 minutes left minus the 1 minute margin.
    assert 110 <= next(iter(fake_cache.ttls.values())) <= 120


def test_nearly_expired_offers_are_not_cached(client_factory, fake_cache):
    client_factory(counting_handler(response_expiring_in(0.5))).post(
        "/flights/search", json=SEARCH
    )
    assert fake_cache.data == {}


def test_provider_errors_are_not_cached(client_factory, fake_cache):
    response = client_factory(lambda _: httpx.Response(500, json={"errors": []})).post(
        "/flights/search", json=SEARCH
    )
    assert response.status_code == 502
    assert fake_cache.data == {}


def test_unreadable_cache_entry_is_a_miss(client_factory, fake_cache):
    handler = counting_handler(response_expiring_in(30))
    client = client_factory(handler)
    client.post("/flights/search", json=SEARCH)
    key = next(iter(fake_cache.data))
    fake_cache.data[key] = "not valid json"

    response = client.post("/flights/search", json=SEARCH)
    assert response.status_code == 200
    assert handler.calls == 2
    assert fake_cache.data[key] != "not valid json"


def test_redis_down_does_not_raise():
    async def run():
        # Nothing listens on port 1, so every call fails to connect.
        redis_cache = RedisCache("127.0.0.1", 1)
        assert await redis_cache.get("key") is None
        await redis_cache.set("key", "value", 60)
        await redis_cache.close()

    asyncio.run(run())
