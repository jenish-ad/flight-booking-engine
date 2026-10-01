"""Duffel flight search/pricing transport and response normalization."""

import httpx

from app.core.config import Settings
from app.schemas.flight import (
    FlightOffer,
    FlightSearchRequest,
    FlightSearchResponse,
    PricedOffer,
)


class DuffelError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class DuffelService:
    def __init__(self, settings: Settings, client: httpx.AsyncClient):
        self.settings = settings
        self.client = client

    async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        """Send a request to Duffel and map transport/auth/rate-limit failures.

        Endpoint-specific 4xx handling is left to the caller.
        """
        token = self.settings.duffel_access_token.get_secret_value().strip()
        if not token:
            raise DuffelError(
                503, "Flights are not configured: DUFFEL_ACCESS_TOKEN is missing."
            )
        try:
            response = await self.client.request(
                method,
                f"{str(self.settings.duffel_base_url).rstrip('/')}{path}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Duffel-Version": "v2",
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip",
                },
                timeout=httpx.Timeout(30.0, connect=10.0),
                follow_redirects=False,
                **kwargs,
            )
        except httpx.TimeoutException:
            raise DuffelError(504, "Duffel timed out. Please try again.") from None
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
            raise DuffelError(429, "Duffel rate limit reached. Please try again later.")
        return response

    async def search(self, search: FlightSearchRequest) -> FlightSearchResponse:
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
        response = await self._request(
            "POST",
            "/air/offer_requests",
            params={"return_offers": "true"},
            json=payload,
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
            data = response.json()["data"]
            return FlightSearchResponse(
                offer_request_id=data["id"],
                offers=[self._normalize_offer(offer) for offer in data["offers"]],
            )
        except (KeyError, TypeError, ValueError, IndexError, AttributeError):
            raise DuffelError(
                502, "Duffel returned an invalid flight search response."
            ) from None

    async def get_offer(self, offer_id: str) -> PricedOffer:
        """Fetch the latest version of an offer, re-checked with the airline."""
        response = await self._request("GET", f"/air/offers/{offer_id}")
        if response.status_code in (400, 404, 410, 422):
            raise DuffelError(
                410, "This offer is no longer available. Please search again."
            )
        if not response.is_success:
            raise DuffelError(
                502, "Duffel could not confirm the price. Please try again later."
            )

        try:
            offer = response.json()["data"]
            payment = offer.get("payment_requirements") or {}
            return PricedOffer(
                offer=self._normalize_offer(offer),
                requires_instant_payment=payment.get("requires_instant_payment", True),
                price_guaranteed_until=payment.get("price_guarantee_expires_at"),
                passenger_identity_documents_required=offer.get(
                    "passenger_identity_documents_required", False
                ),
            )
        except (KeyError, TypeError, ValueError, IndexError, AttributeError):
            raise DuffelError(
                502, "Duffel returned an invalid offer response."
            ) from None

    @staticmethod
    def _normalize_offer(offer: dict) -> FlightOffer:
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
                            "flight_number": segment["marketing_carrier_flight_number"],
                        }
                        for segment in segments
                    ],
                }
            )
        return FlightOffer(
            id=offer["id"],
            airline=offer["owner"],
            total_amount=offer["total_amount"],
            total_currency=offer["total_currency"],
            expires_at=offer["expires_at"],
            slices=slices,
        )
