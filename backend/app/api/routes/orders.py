from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlmodel import Session

from app.api.deps import CurrentUser, DuffelServiceDep, SessionDep
from app.crud import orders as crud
from app.models.orders import Order, OrderStatus
from app.models.users import UserInDB
from app.schemas.booking import (
    CancellationId,
    CreateOrderRequest,
    OrderCancellation,
    OrderId,
    OrderResponse,
)
from app.services.duffel import DuffelError

router = APIRouter(prefix="/orders", tags=["orders"])


def get_owned_order(session: Session, user: UserInDB, order_id: str) -> Order:
    # 404 rather than 403 so other users can't tell whether an order id exists.
    order = crud.get_user_order(session, user.id, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def ensure_not_cancelled(order: Order) -> None:
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status_code=409, detail="This order is already cancelled")


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    order: CreateOrderRequest,
    service: DuffelServiceDep,
    session: SessionDep,
    current_user: CurrentUser,
) -> OrderResponse:
    try:
        booked = await service.create_order(order)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None

    crud.create_order(session, current_user.id, booked)
    return booked


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: OrderId,
    service: DuffelServiceDep,
    session: SessionDep,
    current_user: CurrentUser,
) -> OrderResponse:
    get_owned_order(session, current_user, order_id)
    try:
        return await service.get_order(order_id)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None


@router.post(
    "/{order_id}/cancellations", response_model=OrderCancellation, status_code=201
)
async def request_cancellation(
    order_id: OrderId,
    service: DuffelServiceDep,
    session: SessionDep,
    current_user: CurrentUser,
) -> OrderCancellation:
    """Get a refund quote. The order is not cancelled until the quote is confirmed."""
    order = get_owned_order(session, current_user, order_id)
    ensure_not_cancelled(order)
    try:
        quote = await service.create_cancellation(order.duffel_order_id)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None

    crud.set_pending_cancellation(session, order, quote.id)
    return quote


@router.post(
    "/{order_id}/cancellations/{cancellation_id}/confirm",
    response_model=OrderCancellation,
)
async def confirm_cancellation(
    order_id: OrderId,
    cancellation_id: CancellationId,
    service: DuffelServiceDep,
    session: SessionDep,
    current_user: CurrentUser,
) -> OrderCancellation:
    order = get_owned_order(session, current_user, order_id)
    ensure_not_cancelled(order)
    # Only the latest quote requested for this order can be confirmed.
    if order.pending_cancellation_id != cancellation_id:
        raise HTTPException(status_code=404, detail="Cancellation not found")
    try:
        cancellation = await service.confirm_cancellation(cancellation_id)
    except DuffelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None

    # Marked cancelled only after Duffel confirms, so a failed call leaves it bookable.
    crud.mark_order_cancelled(
        session, order, cancellation.confirmed_at or datetime.now(timezone.utc)
    )
    return cancellation
