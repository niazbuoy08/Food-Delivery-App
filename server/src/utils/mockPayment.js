import crypto from 'crypto';
import { ApiError } from './ApiError.js';

/**
 * Stands in for a real payment gateway.
 *
 * Nothing here touches a network. It validates the card shape, sleeps briefly so
 * the UI's "processing" state is visible, and returns a transaction id. Swap this
 * one module for a Stripe PaymentIntent call and the order flow above it does not
 * change.
 *
 * Test cards:
 *   4242 4242 4242 4242 -> approved
 *   4000 0000 0000 0002 -> declined
 *   any other 16 digits -> approved
 */
const DECLINE_CARD = '4000000000000002';

export async function chargeCard({ cardNumber, expiry, cvv, nameOnCard }) {
  const digits = String(cardNumber || '').replace(/\s+/g, '');

  if (!/^\d{16}$/.test(digits)) throw new ApiError(400, 'Enter a valid 16-digit card number.');
  if (!luhnCheck(digits)) throw new ApiError(400, 'That card number is not valid.');
  if (!/^\d{2}\/\d{2}$/.test(String(expiry || ''))) throw new ApiError(400, 'Expiry must be MM/YY.');
  if (!/^\d{3,4}$/.test(String(cvv || ''))) throw new ApiError(400, 'Enter a valid CVV.');
  if (!String(nameOnCard || '').trim()) throw new ApiError(400, 'Enter the name on the card.');

  if (isExpired(expiry)) throw new ApiError(400, 'That card has expired.');

  await new Promise((resolve) => setTimeout(resolve, 900));

  if (digits === DECLINE_CARD) {
    throw new ApiError(402, 'Your card was declined. Try a different payment method.');
  }

  return {
    transactionId: `txn_${crypto.randomBytes(10).toString('hex')}`,
    cardLast4: digits.slice(-4),
  };
}

function isExpired(expiry) {
  const [mm, yy] = String(expiry).split('/').map(Number);
  if (mm < 1 || mm > 12) return true;
  const now = new Date();
  const expiresEndOf = new Date(2000 + yy, mm, 0, 23, 59, 59);
  return expiresEndOf < now;
}

// The checksum every real card number satisfies. Catches typos before they'd
// ever reach a gateway.
function luhnCheck(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
