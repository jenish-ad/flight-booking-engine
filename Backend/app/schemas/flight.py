from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

AirportCode = Annotated[
    str,
    StringConstraints(strip_whitespace=True, to_upper=True, pattern=r"^[A-Za-z]{3}$"),
]

CurrencyCode = Annotated[
    str,
    StringConstraints(strip_whitespace=True, to_upper=True, pattern=r"^[A-Za-z]{3}$"),
]

OfferId = Annotated[str, StringConstraints(pattern=r"^off_[A-Za-z0-9]+$")]
PassengerId = Annotated[str, StringConstraints(pattern=r"^pas_[A-Za-z0-9]+$")]


class FlightSearchRequest(BaseModel):
    origin: AirportCode
    destination: AirportCode
    departure_date: date
    adults: int = Field(default=1, ge=1, le=9, strict=True)
    cabin_class: Literal["economy", "premium_economy", "business", "first"] = "economy"

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "origin": "SYD",
                    "destination": "MEL",
                    "departure_date": "2026-10-20",
                    "adults": 1,
                    "cabin_class": "economy",
                }
            ]
        }
    )

    @model_validator(mode="after")
    def validate_journey(self):
        if self.origin == self.destination:
            raise ValueError("Origin and destination must be different")
        if self.departure_date < datetime.now(timezone.utc).date():
            raise ValueError("Departure date must not be in the past")
        return self


class Airline(BaseModel):
    name: str
    iata_code: str | None


class Airport(BaseModel):
    name: str
    iata_code: str | None
    time_zone: str | None = None


class FlightSegment(BaseModel):
    id: str
    origin: Airport
    destination: Airport
    departing_at: datetime
    arriving_at: datetime
    marketing_carrier: Airline
    operating_carrier: Airline
    flight_number: str = Field(description="Marketing carrier's flight number")


class FlightSlice(BaseModel):
    id: str
    origin: Airport
    destination: Airport
    departing_at: datetime
    arriving_at: datetime
    stops: int = Field(ge=0, description="Connections plus intermediate segment stops")
    segments: list[FlightSegment] = Field(min_length=1)


class FlightPassenger(BaseModel):
    id: PassengerId
    type: str | None = None


class FlightOffer(BaseModel):
    id: str
    airline: Airline
    total_amount: Decimal = Field(ge=0)
    total_currency: str
    expires_at: datetime
    passengers: list[FlightPassenger] = Field(min_length=1)
    slices: list[FlightSlice] = Field(min_length=1)


class FlightSearchResponse(BaseModel):
    offer_request_id: str
    passengers: list[FlightPassenger] = Field(min_length=1)
    offers: list[FlightOffer]


class PriceConfirmRequest(BaseModel):
    expected_amount: Decimal = Field(ge=0, description="Price the user saw in search")
    expected_currency: CurrencyCode

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "expected_amount": "125.40",
                    "expected_currency": "AUD",
                }
            ]
        }
    )


class PricedOffer(BaseModel):
    offer: FlightOffer
    requires_instant_payment: bool
    price_guaranteed_until: datetime | None
    passenger_identity_documents_required: bool


class PriceConfirmResponse(PricedOffer):
    price_changed: bool
    previous_amount: Decimal
    previous_currency: str
