"""Duffel flight search transport and response normalization."""

import httpx

from app.core.config import Settings
from app.schemas.flight import FlightSearchRequest, FlightSearchResponse


class DuffelError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class DuffelService:
    def __init__(self, settings: Settings, client: httpx.AsyncClient):
        self.settings = settings
        self.client = client

    async def search(self, search: FlightSearchRequest) -> FlightSearchResponse:
        token = self.settings.duffel_access_token.get_secret_value().strip()
        if not token:
            raise DuffelError(
                503, "Flight search is not configured: DUFFEL_ACCESS_TOKEN is missing."
            )
        payload = {
            "data": {
                "slices": [
                    {
                        "origin": search.origin,
                        "destination": search.destination,
                        "departure_date": search.departure_date.isoformat(),
                    }
                ],
                "passengers": [{"type": "adult"} for _ in range(search.adults)],
                "cabin_class": search.cabin_class,
            }
        }
        try:
            response = await self.client.post(
                f"{str(self.settings.duffel_base_url).rstrip('/')}/air/offer_requests",
                params={"return_offers": "true"},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Duffel-Version": "v2",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Accept-Encoding": "gzip",
                },
                json=payload,
                timeout=httpx.Timeout(30.0, connect=10.0),
                follow_redirects=False,
            )
        except httpx.TimeoutException:
            raise DuffelError(
                504, "Duffel flight search timed out. Please try again."
            ) from None
        except httpx.RequestError:
            raise DuffelError(
                502, "Unable to reach Duffel. Please try again later."
            ) from None

        # Do not forward raw provider errors: they may include sensitive request data.
        if response.status_code in (401, 403):
            raise DuffelError(
                503,
                "Duffel authentication failed. Check the server's access token and permissions.",
            )
        if response.status_code == 429:
            raise DuffelError(
                429, "Duffel search rate limit reached. Please try again later."
            )
        if response.status_code in (400, 422):
            raise DuffelError(
                422,
                "Duffel rejected the search. Check the airport codes, departure date, passengers and cabin class.",
            )
        if not response.is_success:
            raise DuffelError(
                502,
                "Duffel could not complete the flight search. Please try again later.",
            )

        try:
            return self._normalize(response.json())
        except (KeyError, TypeError, ValueError, IndexError, AttributeError):
            raise DuffelError(
                502, "Duffel returned an invalid flight search response."
            ) from None

    @staticmethod
    def _normalize(payload: dict) -> FlightSearchResponse:
        data = payload["data"]
        offers = []
        for offer in data["offers"]:
            slices = []
            for flight_slice in offer["slices"]:
                segments = flight_slice["segments"]
                slices.append(
                    {
                        "origin": segments[0]["origin"],
                        "destination": segments[-1]["destination"],
                        "departing_at": segments[0]["departing_at"],
                        "arriving_at": segments[-1]["arriving_at"],
                        "stops": len(segments)
                        - 1
                        + sum(len(s.get("stops") or []) for s in segments),
                        "segments": [
                            {
                                "origin": segment["origin"],
                                "destination": segment["destination"],
                                "departing_at": segment["departing_at"],
                                "arriving_at": segment["arriving_at"],
                                "marketing_carrier": segment["marketing_carrier"],
                                "operating_carrier": segment["operating_carrier"],
                                "flight_number": segment[
                                    "marketing_carrier_flight_number"
                                ],
                            }
                            for segment in segments
                        ],
                    }
                )
            offers.append(
                {
                    "id": offer["id"],
                    "airline": offer["owner"],
                    "total_amount": offer["total_amount"],
                    "total_currency": offer["total_currency"],
                    "expires_at": offer["expires_at"],
                    "slices": slices,
                }
            )
        return FlightSearchResponse(offer_request_id=data["id"], offers=offers)
