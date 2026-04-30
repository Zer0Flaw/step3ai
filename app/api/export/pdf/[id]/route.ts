import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ManualPDF } from "@/components/pdf/ManualPDF";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: job } = await db
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!job || job.status !== "done") {
    return NextResponse.json({ error: "Job not found or not ready" }, { status: 404 });
  }

  const { data: sections } = await db
    .from("job_sections")
    .select("*, job_steps(*)")
    .eq("job_id", params.id)
    .order("order_index");

  const pdfElement = createElement(ManualPDF, {
    title: job.title as string,
    description: (job.description as string | null) ?? undefined,
    estimatedTime: (job.estimated_time as string | null) ?? undefined,
    sections: ((sections ?? []) as Array<{ title: string; job_steps: Array<{ title: string; description: string; note: string | null; order_index: number }> }>).map((s) => ({
      title: s.title,
      steps: (s.job_steps ?? []).sort((a, b) => a.order_index - b.order_index),
    })),
  });

  const buffer = await renderToBuffer(pdfElement);
  const uint8Array = new Uint8Array(buffer);
  const filename = `${(job.title as string).replace(/[^a-z0-9]/gi, "_").toLowerCase()}_manual.pdf`;

  return new NextResponse(uint8Array, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
