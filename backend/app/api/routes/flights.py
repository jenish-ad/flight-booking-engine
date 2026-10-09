from fastapi import APIRouter, HTTPException

from app.api.deps import DuffelServiceDep
from app.schemas.flight import FlightSearchRequest, FlightSearchResponse
from app.services.duffel import DuffelError

router = APIRouter(prefix="/flights", tags=["flights"])


@router.post("/search", response_model=FlightSearchResponse)
async def search_flights(
    search: FlightSearchRequest,
    service: DuffelServiceDep,
) -> FlightSearchResponse:
    try:
        return await service.search(search)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None
