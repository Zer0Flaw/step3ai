import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: job, error } = await db
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: sections } = await db
    .from("job_sections")
    .select("*, job_steps(*)")
    .eq("job_id", params.id)
    .order("order_index");

  return NextResponse.json({ job, sections: sections ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const body = await req.json();

  const { data: existing } = await db
    .from("jobs")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: job, error } = await db
    .from("jobs")
    .update({ title: body.title, description: body.description })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  const { error } = await db
    .from("jobs")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
