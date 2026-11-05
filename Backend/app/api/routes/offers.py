from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DuffelServiceDep
from app.schemas.flight import OfferId, PriceConfirmRequest, PriceConfirmResponse
from app.schemas.seat_map import SeatMapsResponse
from app.services.duffel import DuffelError

router = APIRouter(prefix="/offers", tags=["offers"])


@router.post("/{offer_id}/price", response_model=PriceConfirmResponse)
async def confirm_price(
    offer_id: OfferId,
    request: PriceConfirmRequest,
    service: DuffelServiceDep,
    current_user: CurrentUser,
) -> PriceConfirmResponse:
    try:
        priced = await service.get_offer(offer_id)
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


@router.get("/{offer_id}/seat-maps", response_model=SeatMapsResponse)
async def get_seat_maps(
    offer_id: OfferId,
    service: DuffelServiceDep,
    current_user: CurrentUser,
) -> SeatMapsResponse:
    try:
        return await service.get_seat_maps(offer_id)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None
