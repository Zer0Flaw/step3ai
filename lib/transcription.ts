import { YoutubeTranscript } from "youtube-transcript";
import { getOpenAI } from "./openai";
import { extractYouTubeId, extractLoomId } from "./utils";
import fs from "fs";

export async function transcribeYouTube(url: string): Promise<string> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((t) => t.text).join(" ");
  } catch {
    throw new Error(
      "Could not retrieve transcript. The video may not have captions enabled."
    );
  }
}

export async function transcribeAudioFile(filePath: string): Promise<string> {
  const openai = getOpenAI();
  const fileStream = fs.createReadStream(filePath);

  const transcription = await openai.audio.transcriptions.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file: fileStream as any,
    model: "whisper-1",
    response_format: "text",
  });

  return transcription as unknown as string;
}

export async function transcribeLoom(url: string): Promise<string> {
  const loomId = extractLoomId(url);
  if (!loomId) throw new Error("Invalid Loom URL");

  throw new Error(
    "Loom direct transcription is not supported yet. Please download the video and upload it as an MP4."
  );
}

export type TranscriptionSource = "youtube" | "loom" | "file";

export async function getTranscript(
  source: TranscriptionSource,
  input: string
): Promise<string> {
  switch (source) {
    case "youtube":
      return transcribeYouTube(input);
    case "loom":
      return transcribeLoom(input);
    case "file":
      return transcribeAudioFile(input);
    default:
      throw new Error("Unknown transcription source");
  }
}
