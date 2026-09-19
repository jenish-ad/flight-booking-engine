from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_duffel_service
from app.schemas.flight import FlightSearchRequest, FlightSearchResponse
from app.services.duffel import DuffelError, DuffelService

router = APIRouter()


@router.get("/flights")
async def get_flights():
    return {"message": "List of flights"}


@router.post("/flights/search", response_model=FlightSearchResponse, tags=["flights"])
async def search_flights(
    search: FlightSearchRequest,
    service: Annotated[DuffelService, Depends(get_duffel_service)],
) -> FlightSearchResponse:
    try:
        return await service.search(search)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None
