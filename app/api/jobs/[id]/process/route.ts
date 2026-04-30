import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { getTranscript } from "@/lib/transcription";
import { extractStepsFromTranscript } from "@/lib/openai";
import { extractYouTubeId } from "@/lib/utils";

export async function POST(
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

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobRecord = job as any;
  if (jobRecord.status === "done") {
    return NextResponse.json({ error: "Job already processed" }, { status: 400 });
  }

  try {
    await db.from("jobs").update({ status: "transcribing" }).eq("id", params.id);

    let transcript: string;
    let thumbnailUrl: string | null = null;

    if (jobRecord.source_type === "youtube" && jobRecord.source_url) {
      transcript = await getTranscript("youtube", jobRecord.source_url as string);
      const ytId = extractYouTubeId(jobRecord.source_url as string);
      if (ytId) {
        thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    } else if (jobRecord.source_type === "loom" && jobRecord.source_url) {
      transcript = await getTranscript("loom", jobRecord.source_url as string);
    } else if (jobRecord.source_type === "file" && jobRecord.source_file_path) {
      transcript = await getTranscript("file", jobRecord.source_file_path as string);
    } else {
      throw new Error("Invalid job configuration");
    }

    await db
      .from("jobs")
      .update({ status: "extracting", transcript })
      .eq("id", params.id);

    const manual = await extractStepsFromTranscript(transcript);

    await db.from("job_sections").delete().eq("job_id", params.id);

    const allSteps: Array<{
      job_id: string;
      section_id: string;
      title: string;
      description: string;
      note: string | null;
      order_index: number;
    }> = [];

    for (let sIdx = 0; sIdx < manual.sections.length; sIdx++) {
      const section = manual.sections[sIdx];

      const { data: sectionRow } = await db
        .from("job_sections")
        .insert({
          job_id: params.id,
          title: section.title,
          order_index: sIdx,
        })
        .select("id")
        .single();

      if (sectionRow) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sectionId = (sectionRow as any).id as string;
        for (let stepIdx = 0; stepIdx < section.steps.length; stepIdx++) {
          const step = section.steps[stepIdx];
          allSteps.push({
            job_id: params.id,
            section_id: sectionId,
            title: step.title,
            description: step.description,
            note: step.note,
            order_index: stepIdx,
          });
        }
      }
    }

    if (allSteps.length > 0) {
      await db.from("job_steps").insert(allSteps);
    }

    await db
      .from("jobs")
      .update({
        status: "done",
        title: manual.title,
        description: manual.description,
        estimated_time: manual.estimated_time,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        manual_data: manual as any,
        thumbnail_url: thumbnailUrl,
      })
      .eq("id", params.id);

    const { data: usageRow } = await db
      .from("user_usage")
      .select("conversion_count")
      .eq("user_id", userId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentCount = (usageRow as any)?.conversion_count ?? 0;

    await db.from("user_usage").upsert(
      { user_id: userId, conversion_count: currentCount + 1, plan: "free" },
      { onConflict: "user_id" }
    );

    return NextResponse.json({ success: true, manual });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    await db
      .from("jobs")
      .update({ status: "error", error_message: message })
      .eq("id", params.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
