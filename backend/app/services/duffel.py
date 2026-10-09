from decimal import Decimal

import httpx

from app.core.config import Settings
from app.schemas.booking import CreateOrderRequest, OrderCancellation, OrderResponse
from app.schemas.flight import (
    FlightOffer,
    FlightSearchRequest,
    FlightSearchResponse,
    PricedOffer,
)
from app.schemas.seat_map import SeatMap, SeatMapsResponse


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
                passengers=data["passengers"],
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

    async def get_seat_maps(self, offer_id: str) -> SeatMapsResponse:
        response = await self._request(
            "GET", "/air/seat_maps", params={"offer_id": offer_id}
        )
        if response.status_code in (400, 404, 410, 422):
            raise DuffelError(
                410, "This offer is no longer available. Please search again."
            )
        if not response.is_success:
            raise DuffelError(
                502, "Duffel could not load the seat map. Please try again later."
            )

        try:
            return SeatMapsResponse(
                offer_id=offer_id,
                seat_maps=[
                    self._normalize_seat_map(seat_map)
                    for seat_map in response.json()["data"]
                ],
            )
        except (KeyError, TypeError, ValueError, IndexError, AttributeError):
            raise DuffelError(
                502, "Duffel returned an invalid seat map response."
            ) from None

    async def _seats_total(self, order: CreateOrderRequest) -> Decimal:
        """Check the selected seats against the live seat map and sum their prices.

        The client only sends seat ids, so it cannot change what a seat costs.
        """
        seat_maps = (await self.get_seat_maps(order.offer_id)).seat_maps
        available = {
            service.id: (seat_map.segment_id, service)
            for seat_map in seat_maps
            for cabin in seat_map.cabins
            for row in cabin.rows
            for section in row.sections
            for element in section
            for service in element.available_services
        }
        passenger_ids = {passenger.id for passenger in order.passengers}
        booked = set()
        total = Decimal(0)
        for service_id in order.services:
            if service_id not in available:
                raise DuffelError(
                    409,
                    "A selected seat is no longer available. Please reload the seat map.",
                )
            segment_id, service = available[service_id]
            if service.passenger_id not in passenger_ids:
                raise DuffelError(
                    422, "A selected seat is for a passenger who is not on this order."
                )
            if (service.passenger_id, segment_id) in booked:
                raise DuffelError(
                    422, "Each passenger can select only one seat per flight."
                )
            if service.total_currency != order.currency:
                raise DuffelError(
                    409, "Seat prices are in a different currency from the flight."
                )
            booked.add((service.passenger_id, segment_id))
            total += service.total_amount
        return total

    async def create_order(self, order: CreateOrderRequest) -> OrderResponse:
        amount = order.amount
        if order.services:
            amount += await self._seats_total(order)

        payload = {
            "data": {
                "type": "instant",
                "selected_offers": [order.offer_id],
                "passengers": [
                    passenger.model_dump(mode="json") for passenger in order.passengers
                ],
                "payments": [
                    {
                        "type": "balance",
                        "amount": str(amount),
                        "currency": order.currency,
                    }
                ],
            }
        }
        if order.services:
            payload["data"]["services"] = [
                {"id": service_id, "quantity": 1} for service_id in order.services
            ]
        response = await self._request("POST", "/air/orders", json=payload)
        if response.status_code in (400, 404, 410, 422):
            raise DuffelError(
                409,
                "This offer can no longer be booked. Please confirm the price again.",
            )
        if not response.is_success:
            raise DuffelError(
                502, "Duffel could not create the order. Please try again later."
            )

        return self._parse_order(response)

    async def get_order(self, order_id: str) -> OrderResponse:
        response = await self._request("GET", f"/air/orders/{order_id}")
        if response.status_code == 404:
            raise DuffelError(404, "Order not found.")
        if not response.is_success:
            raise DuffelError(
                502, "Duffel could not load the order. Please try again later."
            )
        return self._parse_order(response)

    async def create_cancellation(self, order_id: str) -> OrderCancellation:
        """Ask Duffel for a cancellation quote. Nothing is cancelled until it is confirmed."""
        response = await self._request(
            "POST", "/air/order_cancellations", json={"data": {"order_id": order_id}}
        )
        if response.status_code in (400, 404, 409, 422):
            raise DuffelError(409, "This order cannot be cancelled.")
        if not response.is_success:
            raise DuffelError(
                502, "Duffel could not start the cancellation. Please try again later."
            )
        return self._parse_cancellation(response)

    async def confirm_cancellation(self, cancellation_id: str) -> OrderCancellation:
        response = await self._request(
            "POST", f"/air/order_cancellations/{cancellation_id}/actions/confirm"
        )
        if response.status_code in (400, 404, 409, 410, 422):
            raise DuffelError(
                409,
                "This cancellation quote has expired or was replaced. Please request a new one.",
            )
        if not response.is_success:
            raise DuffelError(
                502,
                "Duffel could not confirm the cancellation. Please try again later.",
            )
        return self._parse_cancellation(response)

    def _parse_order(self, response: httpx.Response) -> OrderResponse:
        try:
            data = response.json()["data"]
            return OrderResponse(
                id=data["id"],
                booking_reference=data["booking_reference"],
                total_amount=data["total_amount"],
                total_currency=data["total_currency"],
                created_at=data["created_at"],
                cancelled_at=data.get("cancelled_at"),
                slices=self._normalize_slices(data["slices"]),
            )
        except (KeyError, TypeError, ValueError, IndexError, AttributeError):
            raise DuffelError(
                502, "Duffel returned an invalid order response."
            ) from None

    @staticmethod
    def _parse_cancellation(response: httpx.Response) -> OrderCancellation:
        try:
            data = response.json()["data"]
            return OrderCancellation(
                id=data["id"],
                order_id=data["order_id"],
                refund_amount=data.get("refund_amount"),
                refund_currency=data.get("refund_currency"),
                refund_to=data.get("refund_to"),
                expires_at=data["expires_at"],
                confirmed_at=data.get("confirmed_at"),
            )
        except (KeyError, TypeError, ValueError, AttributeError):
            raise DuffelError(
                502, "Duffel returned an invalid cancellation response."
            ) from None

    @staticmethod
    def _normalize_slices(raw_slices: list[dict]) -> list[dict]:
        slices = []
        for flight_slice in raw_slices:
            segments = flight_slice["segments"]
            slices.append(
                {
                    "id": flight_slice["id"],
                    "origin": segments[0]["origin"],
                    "destination": segments[-1]["destination"],
                    "departing_at": segments[0]["departing_at"],
                    "arriving_at": segments[-1]["arriving_at"],
                    "stops": len(segments)
                    - 1
                    + sum(len(s.get("stops") or []) for s in segments),
                    "segments": [
                        {
                            "id": segment["id"],
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
        return slices

    @staticmethod
    def _normalize_seat_map(seat_map: dict) -> SeatMap:
        return SeatMap(
            id=seat_map["id"],
            slice_id=seat_map["slice_id"],
            segment_id=seat_map["segment_id"],
            cabins=[
                {
                    "cabin_class": cabin["cabin_class"],
                    "deck": cabin["deck"],
                    "aisles": cabin["aisles"],
                    "wings": cabin.get("wings"),
                    "rows": [
                        {
                            "sections": [
                                [
                                    {
                                        "type": element["type"],
                                        "designator": element.get("designator"),
                                        "name": element.get("name"),
                                        "disclosures": element.get("disclosures") or [],
                                        "available_services": [
                                            {
                                                "id": service["id"],
                                                "passenger_id": service["passenger_id"],
                                                "total_amount": service["total_amount"],
                                                "total_currency": service[
                                                    "total_currency"
                                                ],
                                            }
                                            for service in element.get(
                                                "available_services"
                                            )
                                            or []
                                        ],
                                    }
                                    for element in section["elements"]
                                ]
                                for section in row["sections"]
                            ]
                        }
                        for row in cabin["rows"]
                    ],
                }
                for cabin in seat_map["cabins"]
            ],
        )

    @staticmethod
    def _normalize_offer(offer: dict) -> FlightOffer:
        return FlightOffer(
            id=offer["id"],
            airline=offer["owner"],
            total_amount=offer["total_amount"],
            total_currency=offer["total_currency"],
            expires_at=offer["expires_at"],
            passengers=offer["passengers"],
            slices=DuffelService._normalize_slices(offer["slices"]),
        )
