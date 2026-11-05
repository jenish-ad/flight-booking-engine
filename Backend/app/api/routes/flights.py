from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.api.deps import CacheDep, DuffelServiceDep
from app.schemas.flight import FlightSearchRequest, FlightSearchResponse
from app.services.duffel import DuffelError

router = APIRouter(prefix="/flights", tags=["flights"])

SEARCH_CACHE_MAX_SECONDS = 300
EMPTY_SEARCH_CACHE_SECONDS = 60
# Stop serving cached offers this long before the first one expires.
OFFER_EXPIRY_MARGIN_SECONDS = 60


def search_cache_key(search: FlightSearchRequest) -> str:
    # Every field that changes the results must be part of the key.
    # Bump v1 when FlightSearchResponse changes so old entries are ignored.
    return (
        f"flights:search:v1:{search.origin}:{search.destination}:"
        f"{search.departure_date}:{search.adults}:{search.cabin_class}"
    )


def search_cache_ttl(result: FlightSearchResponse) -> int:
    """Seconds to cache a result, never past the moment its first offer expires."""
    if not result.offers:
        return EMPTY_SEARCH_CACHE_SECONDS
    first_expiry = min(offer.expires_at for offer in result.offers)
    seconds_left = (first_expiry - datetime.now(timezone.utc)).total_seconds()
    return int(
        max(
            0, min(SEARCH_CACHE_MAX_SECONDS, seconds_left - OFFER_EXPIRY_MARGIN_SECONDS)
        )
    )


@router.post("/search", response_model=FlightSearchResponse)
async def search_flights(
    search: FlightSearchRequest,
    service: DuffelServiceDep,
    cache: CacheDep,
) -> FlightSearchResponse:
    key = search_cache_key(search)
    cached = await cache.get(key)
    if cached is not None:
        try:
            return FlightSearchResponse.model_validate_json(cached)
        except ValidationError:
            pass  # Unreadable entry: treat it as a miss and overwrite it below.

    try:
        result = await service.search(search)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None

    ttl = search_cache_ttl(result)
    if ttl > 0:
        await cache.set(key, result.model_dump_json(), ttl)
    return result
