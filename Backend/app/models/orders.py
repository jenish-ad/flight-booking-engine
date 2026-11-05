import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


class OrderStatus:
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="userindb.id", index=True)
    duffel_order_id: str = Field(unique=True, index=True)
    booking_reference: str
    total_amount: Decimal = Field(max_digits=12, decimal_places=3)
    total_currency: str = Field(max_length=3)
    status: str = Field(default=OrderStatus.CONFIRMED)
    # Duffel only lets the latest cancellation quote for an order be confirmed.
    pending_cancellation_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    cancelled_at: datetime | None = None
