import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { steps } = await req.json() as { steps: Array<{ id: string; title: string; description: string; order_index: number; section_id?: string }> };

  const { data: job } = await db
    .from("jobs")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  for (const step of steps) {
    await db
      .from("job_steps")
      .update({
        title: step.title,
        description: step.description,
        order_index: step.order_index,
        section_id: step.section_id ?? null,
      })
      .eq("id", step.id)
      .eq("job_id", params.id);
  }

  return NextResponse.json({ success: true });
}
