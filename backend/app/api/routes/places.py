from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

from app.api.deps import CacheDep, DuffelServiceDep
from app.schemas.places import PlaceSearchResponse
from app.services.duffel import DuffelError

router = APIRouter(prefix="/places", tags=["places"])

# airports don't change often so we can cache for a day
PLACES_TTL = 24 * 60 * 60
EMPTY_PLACES_TTL = 60 * 60


@router.get("", response_model=PlaceSearchResponse)
async def search_places(
    query: Annotated[str, Query(max_length=50)],
    service: DuffelServiceDep,
    cache: CacheDep,
) -> PlaceSearchResponse:
    # so "  New  York" and "new york" hit the same cache entry
    query = " ".join(query.split()).lower()
    if len(query) < 2:
        raise HTTPException(status_code=422, detail="Type at least 2 characters.")

    key = f"places:search:v1:{query}"
    cached = await cache.get(key)
    if cached is not None:
        try:
            return PlaceSearchResponse.model_validate_json(cached)
        except ValidationError:
            pass

    try:
        result = await service.search_places(query)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None

    ttl = PLACES_TTL if result.places else EMPTY_PLACES_TTL
    await cache.set(key, result.model_dump_json(), ttl)
    return result
