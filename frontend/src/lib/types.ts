// Decimals in pydantic are implemented as strings to avoid floating point precision issues.
export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface Airline {
  name: string;
  iata_code: string | null;
}

export interface Airport {
  name: string;
  iata_code: string | null;
  time_zone?: string | null;
}

export interface FlightSegment {
  id: string;
  origin: Airport;
  destination: Airport;
  departing_at: string;
  arriving_at: string;
  marketing_carrier: Airline;
  operating_carrier: Airline;
  flight_number: string;
}

export interface FlightSlice {
  id: string;
  origin: Airport;
  destination: Airport;
  departing_at: string;
  arriving_at: string;
  stops: number;
  segments: FlightSegment[];
}

export interface FlightPassenger {
  id: string;
  type?: string | null;
}

export interface FlightOffer {
  id: string;
  airline: Airline;
  total_amount: string;
  total_currency: string;
  expires_at: string;
  passengers: FlightPassenger[];
  slices: FlightSlice[];
}

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;
  adults: number;
  cabin_class: CabinClass;
}

export interface FlightSearchResponse {
  offer_request_id: string;
  passengers: FlightPassenger[];
  offers: FlightOffer[];
}

export interface PriceConfirmResponse {
  offer: FlightOffer;
  requires_instant_payment: boolean;
  price_guaranteed_until: string | null;
  passenger_identity_documents_required: boolean;
  price_changed: boolean;
  previous_amount: string;
  previous_currency: string;
}

export interface PlaceAirport {
  id: string;
  name: string;
  iata_code: string;
  iata_city_code?: string | null;
  iata_country_code: string;
  city_name?: string | null;
  time_zone?: string | null;
}

export interface Place extends PlaceAirport {
  type: "airport" | "city";
  airports: PlaceAirport[];
}

export interface PlaceSearchResponse {
  places: Place[];
}

// Seat maps

export interface SeatService {
  id: string;
  passenger_id: string;
  total_amount: string;
  total_currency: string;
}

export type SeatElementType =
  | "seat"
  | "empty"
  | "exit_row"
  | "lavatory"
  | "galley"
  | "closet"
  | "bassinet"
  | "stairs"
  | (string & {});

export interface SeatMapElement {
  type: SeatElementType;
  designator: string | null;
  name: string | null;
  disclosures: string[];
  available_services: SeatService[];
}

export interface SeatMapRow {
  sections: SeatMapElement[][];
}

export interface SeatMapCabin {
  cabin_class: string;
  deck: number;
  aisles: number;
  wings: { first_row_index: number; last_row_index: number } | null;
  rows: SeatMapRow[];
}

export interface SeatMap {
  id: string;
  slice_id: string;
  segment_id: string;
  cabins: SeatMapCabin[];
}

export interface SeatMapsResponse {
  offer_id: string;
  seat_maps: SeatMap[];
}

// Orders

export type Title = "mr" | "ms" | "mrs" | "miss" | "dr";
export type Gender = "m" | "f";

export interface OrderPassenger {
  id: string;
  title: Title;
  gender: Gender;
  given_name: string;
  family_name: string;
  born_on: string;
  email: string;
  phone_number: string;
}

export interface CreateOrderRequest {
  offer_id: string;
  passengers: OrderPassenger[];
  amount: string;
  currency: string;
  services: string[];
}

export interface OrderResponse {
  id: string;
  booking_reference: string;
  total_amount: string;
  total_currency: string;
  created_at: string;
  cancelled_at: string | null;
  slices: FlightSlice[];
}

export interface OrderCancellation {
  id: string;
  order_id: string;
  refund_amount: string | null;
  refund_currency: string | null;
  refund_to: string | null;
  expires_at: string;
  confirmed_at: string | null;
}

export type OrderStatus = "confirmed" | "cancelled";

export interface OrderSummary {
  id: string;
  booking_reference: string;
  total_amount: string;
  total_currency: string;
  status: OrderStatus;
  created_at: string;
  cancelled_at: string | null;
}

export interface OrderList {
  orders: OrderSummary[];
  total: number;
}

// Users and admin

export interface User {
  id: string;
  email: string;
  is_admin?: boolean;
}

export interface AdminOrderSummary extends OrderSummary {
  user_id: string;
  user_email: string | null;
}

export interface AdminOrderList {
  orders: AdminOrderSummary[];
  total: number;
}

export interface AdminOrderDetail {
  summary: AdminOrderSummary;
  order: OrderResponse | null;
  duffel_error: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  order_count: number;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
}

export interface AdminStats {
  users: number;
  orders: number;
  confirmed_orders: number;
  cancelled_orders: number;
  booked_value: { currency: string; amount: string }[];
}
