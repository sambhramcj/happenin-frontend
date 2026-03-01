export const TICKET_ORGANIZER_SHARE_RATIO = 0.95;
export const TICKET_PLATFORM_SHARE_RATIO = 0.05;

export const DIGITAL_PACK_PRICES = {
  silver: 10000,
  gold: 25000,
  platinum: 100000,
} as const;

export const DIGITAL_ORGANIZER_SHARE_RATIO = 0.2;
export const DIGITAL_PLATFORM_SHARE_RATIO = 0.8;

export const FEATURED_BOOST_PRICE = 1000;

export type DigitalPackType = keyof typeof DIGITAL_PACK_PRICES;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toPaise(value: number): number {
  return Math.round(value * 100);
}

export function splitTicketAmount(ticketPrice: number) {
  const organizerAmount = roundMoney(ticketPrice * TICKET_ORGANIZER_SHARE_RATIO);
  const platformAmount = roundMoney(ticketPrice - organizerAmount);
  return { organizerAmount, platformAmount };
}

export function splitDigitalPackAmount(packAmount: number) {
  const organizerShare = roundMoney(packAmount * DIGITAL_ORGANIZER_SHARE_RATIO);
  const platformShare = roundMoney(packAmount - organizerShare);
  return { organizerShare, platformShare };
}
