import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 100MB." },
      { status: 400 }
    );
  }

  const allowedTypes = ["video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav", "audio/mp4"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload MP4, MOV, WebM, MP3, or WAV." },
      { status: 400 }
    );
  }

  const db = createServiceClient();
  const ext = file.name.split(".").pop();
  const filePath = `${userId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await db.storage
    .from("uploads")
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: job, error: jobError } = await db
    .from("jobs")
    .insert({
      user_id: userId,
      title: file.name.replace(/\.[^/.]+$/, ""),
      source_type: "file",
      source_file_path: filePath,
      status: "pending",
    })
    .select()
    .single();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  return NextResponse.json({ job }, { status: 201 });
}
