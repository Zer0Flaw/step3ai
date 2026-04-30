import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { FREE_CONVERSION_LIMIT } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: jobs, error } = await db
    .from("jobs")
    .select("id, title, status, source_type, thumbnail_url, created_at, estimated_time")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: usage } = await db
    .from("user_usage")
    .select("conversion_count, plan")
    .eq("user_id", userId)
    .single();

  const plan = usage?.plan ?? "free";
  const count = usage?.conversion_count ?? 0;

  if (plan === "free" && count >= FREE_CONVERSION_LIMIT) {
    return NextResponse.json(
      {
        error: "free_limit_reached",
        message: `You've used all ${FREE_CONVERSION_LIMIT} free conversions. Upgrade to Pro for unlimited access.`,
      },
      { status: 402 }
    );
  }

  const body = await req.json();
  const { source_type, source_url, title } = body;

  if (!source_type || (!source_url && source_type !== "file")) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: job, error } = await db
    .from("jobs")
    .insert({
      user_id: userId,
      title: title ?? "Untitled Manual",
      source_type,
      source_url: source_url ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!usage) {
    await db.from("user_usage").insert({ user_id: userId, conversion_count: 0, plan: "free" });
  }

  return NextResponse.json({ job }, { status: 201 });
}
