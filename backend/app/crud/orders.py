import uuid
from datetime import datetime

from sqlmodel import Session, select

from app.models.orders import Order, OrderStatus
from app.schemas.booking import OrderResponse


def create_order(session: Session, user_id: uuid.UUID, booked: OrderResponse) -> Order:
    order = Order(
        user_id=user_id,
        duffel_order_id=booked.id,
        booking_reference=booked.booking_reference,
        total_amount=booked.total_amount,
        total_currency=booked.total_currency,
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order


def get_user_order(
    session: Session, user_id: uuid.UUID, duffel_order_id: str
) -> Order | None:
    # Filtering by user_id is what stops one user from reading another's order.
    return session.exec(
        select(Order).where(
            Order.duffel_order_id == duffel_order_id, Order.user_id == user_id
        )
    ).first()


def set_pending_cancellation(
    session: Session, order: Order, cancellation_id: str
) -> None:
    order.pending_cancellation_id = cancellation_id
    session.add(order)
    session.commit()


def mark_order_cancelled(
    session: Session, order: Order, cancelled_at: datetime
) -> None:
    order.status = OrderStatus.CANCELLED
    order.cancelled_at = cancelled_at
    order.pending_cancellation_id = None
    session.add(order)
    session.commit()
