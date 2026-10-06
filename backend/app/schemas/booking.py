from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.schemas.flight import CurrencyCode, FlightSlice, OfferId, PassengerId
from app.schemas.seat_map import ServiceId

PersonName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]

PhoneNumber = Annotated[str, StringConstraints(pattern=r"^\+[1-9]\d{6,14}$")]


class OrderPassenger(BaseModel):
    id: PassengerId
    title: Literal["mr", "ms", "mrs", "miss", "dr"]
    gender: Literal["m", "f"]
    given_name: PersonName
    family_name: PersonName
    born_on: date
    email: EmailStr
    phone_number: PhoneNumber = Field(description="E.164 format")

    @field_validator("born_on")
    @classmethod
    def validate_born_on(cls, value: date) -> date:
        if value >= datetime.now(timezone.utc).date():
            raise ValueError("Date of birth must be in the past")
        return value


class CreateOrderRequest(BaseModel):
    offer_id: OfferId
    passengers: list[OrderPassenger] = Field(min_length=1, max_length=9)
    amount: Decimal = Field(
        ge=0,
        description="Flight price from /price; seat prices are added by the server",
    )
    currency: CurrencyCode
    services: list[ServiceId] = Field(
        default=[],
        max_length=50,
        description="Seat service ids (ase_...) from /seat-maps",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "offer_id": "off_0000AEdGRhtp5AUUiJnF9N",
                    "passengers": [
                        {
                            "id": "pas_0000AEdGRhtp5AUUiJnF9M",
                            "title": "ms",
                            "gender": "f",
                            "given_name": "Jane",
                            "family_name": "Doe",
                            "born_on": "1990-05-15",
                            "email": "jane.doe@example.com",
                            "phone_number": "+61400000000",
                        }
                    ],
                    "amount": "125.40",
                    "currency": "AUD",
                    "services": ["ase_0000AEdGRhtp5AUUiJnF9P"],
                }
            ]
        }
    )

    @model_validator(mode="after")
    def validate_unique_passengers(self):
        ids = [passenger.id for passenger in self.passengers]
        if len(ids) != len(set(ids)):
            raise ValueError("Passenger ids must be unique")
        if len(self.services) != len(set(self.services)):
            raise ValueError("Service ids must be unique")
        return self


class OrderResponse(BaseModel):
    id: str
    booking_reference: str
    total_amount: Decimal
    total_currency: str
    created_at: datetime
    slices: list[FlightSlice]
