import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { createPortalSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: usage } = await db
    .from("user_usage")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!usage?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await createPortalSession(usage.stripe_customer_id, `${appUrl}/dashboard`);

  return NextResponse.json({ url: session.url });
}
