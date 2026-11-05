from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

ServiceId = Annotated[str, StringConstraints(pattern=r"^ase_[A-Za-z0-9]+$")]


class SeatService(BaseModel):
    id: str = Field(description="Send this in the order's services to book the seat")
    passenger_id: str
    total_amount: Decimal = Field(ge=0)
    total_currency: str


class SeatMapElement(BaseModel):
    type: str = Field(
        description="seat, empty, exit_row, lavatory, galley, closet, bassinet or stairs"
    )
    designator: str | None = Field(default=None, description="Seat label, e.g. 12A")
    name: str | None = None
    disclosures: list[str] = []
    available_services: list[SeatService] = Field(
        default=[],
        description="One entry per passenger who can book this seat; empty if taken",
    )


class SeatMapRow(BaseModel):
    sections: list[list[SeatMapElement]] = Field(
        description="Groups of elements in the row; aisles sit between sections"
    )


class Wings(BaseModel):
    first_row_index: int
    last_row_index: int


class SeatMapCabin(BaseModel):
    cabin_class: str
    deck: int
    aisles: int
    wings: Wings | None = None
    rows: list[SeatMapRow]


class SeatMap(BaseModel):
    id: str
    slice_id: str
    segment_id: str
    cabins: list[SeatMapCabin]


class SeatMapsResponse(BaseModel):
    offer_id: str
    seat_maps: list[SeatMap] = Field(
        description="One per segment; empty if the airline does not support seat selection"
    )
