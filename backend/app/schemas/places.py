from typing import Literal

from pydantic import BaseModel


class PlaceAirport(BaseModel):
    id: str
    name: str
    iata_code: str
    iata_city_code: str | None = None
    iata_country_code: str
    city_name: str | None = None
    time_zone: str | None = None


class Place(PlaceAirport):
    type: Literal["airport", "city"]
    airports: list[PlaceAirport] = []


class PlaceSearchResponse(BaseModel):
    places: list[Place]
