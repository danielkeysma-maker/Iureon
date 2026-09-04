import type { CheckoutIntent } from './billing.api';

/**
 * The Wompi web checkout URL, built from what the server signed.
 *
 * ONE BUILDER FOR RECHARGES AND PLANS. The same fields Wompi documents for its
 * web checkout, in the query string: it is a GET, so the URL IS the checkout —
 * it serves to navigate and to offer as a fallback link. Every field comes from
 * the server's intent, including the signature, which is what makes editing any
 * of them produce a checkout Wompi refuses.
 */
export const urlDelCheckout = (intent: CheckoutIntent): string => {
  const campos = new URLSearchParams({
    'public-key': intent.publicKey,
    currency: intent.currency,
    'amount-in-cents': String(intent.amountInCents),
    reference: intent.reference,
    'signature:integrity': intent.signature
  });
  // Only when configured: an empty redirect-url sends the client to a blank
  // page after paying, which reads as a failed payment.
  if (intent.redirectUrl) campos.set('redirect-url', intent.redirectUrl);
  return `https://checkout.wompi.co/p/?${campos.toString()}`;
};
