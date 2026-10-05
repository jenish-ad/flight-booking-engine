from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.api.deps import DuffelServiceDep
from app.schemas.booking import CreateOrderRequest, OrderResponse
from app.schemas.flight import (
    FlightSearchRequest,
    FlightSearchResponse,
    PriceConfirmRequest,
    PriceConfirmResponse,
)
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


@router.post("/price", response_model=PriceConfirmResponse)
async def confirm_price(
    request: PriceConfirmRequest,
    service: DuffelServiceDep,
) -> PriceConfirmResponse:
    try:
        priced = await service.get_offer(request.offer_id)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None

    offer = priced.offer
    if offer.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=410, detail="This offer has expired. Please search again."
        )

    return PriceConfirmResponse(
        **priced.model_dump(),
        price_changed=(
            offer.total_amount != request.expected_amount
            or offer.total_currency != request.expected_currency
        ),
        previous_amount=request.expected_amount,
        previous_currency=request.expected_currency,
    )


@router.post("/order", response_model=OrderResponse, status_code=201)
async def create_order(
    order: CreateOrderRequest,
    service: DuffelServiceDep,
) -> OrderResponse:
    try:
        return await service.create_order(order)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None
