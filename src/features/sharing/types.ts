export type Member = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Phone number with country code, used for call / SMS / WhatsApp. May be empty. */
  phone: string;
  /** Set when this person has joined the family on their own phone (cloud only). */
  userId?: string | null;
  /** Profile picture as a small JPEG data URI, or '' for the emoji. */
  photo?: string;
};

/** Something the family shares, e.g. the scooty or the TV. */
export type SharedThing = {
  id: string;
  name: string;
  emoji: string;
};

/**
 * A plan for a member over a period of time: either using a shared thing
 * (scooty, TV…) or a personal plan (doctor visit, paying a bill…) when `thingId` is null.
 */
export type Booking = {
  id: string;
  thingId: string | null;
  memberId: string;
  /** Epoch ms */
  start: number;
  /** Epoch ms — planned end. */
  end: number;
  /** What it's for. Required for personal plans, optional for shared things. */
  purpose: string;
  /** Set when the thing was handed back before `end`. */
  returnedAt?: number;
  /** Member ids this plan is kept secret from (surprises). */
  hiddenFrom?: string[];
};

export type BookingInput = Omit<Booking, 'id' | 'returnedAt'>;

export type SharingState = {
  members: Member[];
  things: SharedThing[];
  bookings: Booking[];
};
