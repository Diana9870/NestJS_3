export interface SeatPosition {
  row: number;
  seat: number;
}

/**
 * Seat layout of a hall: row 1..rows, seat 1..seatsPerRow, in that order.
 * A hall of 3 rows by 5 seats gives 15 seats. Used for GET /halls/:id and to
 * fill `showing.seats` when a showing is created.
 */
export function buildSeatLayout(
  rows: number,
  seatsPerRow: number,
): SeatPosition[] {
  const seats: SeatPosition[] = [];
  for (let row = 1; row <= rows; row++) {
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      seats.push({ row, seat });
    }
  }
  return seats;
}
