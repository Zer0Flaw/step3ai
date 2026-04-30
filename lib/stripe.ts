import Stripe from "stripe";

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export const FREE_CONVERSION_LIMIT = 5;
export const PRO_MONTHLY_PRICE = 9;

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  returnUrl: string
) {
  const stripe = getStripe();
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID!;
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [{ price: proPriceId, quantity: 1 }],
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?cancelled=true`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
