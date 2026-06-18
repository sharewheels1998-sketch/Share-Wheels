/**
 * Razorpay Standard Checkout — Scan & Pay (UPI QR), UPI apps, then cards.
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods/
 */

const UPI_APPS = ["google_pay", "phonepe", "paytm", "bhim"];

export const buildRazorpayCheckoutConfig = () => ({
  method: {
    upi: true,
    card: true,
    netbanking: true,
    wallet: true,
    emi: false,
    paylater: false,
  },
  config: {
    display: {
      blocks: {
        scan_pay: {
          name: "Scan & Pay",
          instruments: [{ method: "upi", flows: ["qr"] }],
        },
        upi_apps: {
          name: "UPI apps",
          instruments: [
            {
              method: "upi",
              flows: ["intent"],
              apps: UPI_APPS,
            },
          ],
        },
        cards: {
          name: "Cards & banking",
          instruments: [
            { method: "card" },
            { method: "netbanking" },
            { method: "wallet" },
          ],
        },
      },
      sequence: ["block.scan_pay", "block.upi_apps", "block.cards"],
      preferences: {
        show_default_blocks: false,
      },
      hide: [{ method: "paylater" }, { method: "emi" }],
    },
  },
});

export const buildRazorpayCheckoutOptions = ({
  key,
  amount,
  currency = "INR",
  name,
  description,
  order_id,
  prefill = {},
  theme,
}) => ({
  key,
  amount,
  currency,
  name,
  description,
  order_id,
  prefill,
  theme: theme || { color: "#2563EB" },
  ...buildRazorpayCheckoutConfig(),
});
