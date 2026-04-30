import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db.from("waitlist").insert({
    email: parsed.data.email,
    source: parsed.data.source ?? "landing",
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
