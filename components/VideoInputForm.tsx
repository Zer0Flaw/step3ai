"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Youtube, Upload, Link2, Loader2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, detectVideoSource } from "@/lib/utils";

type Tab = "url" | "upload";

export function VideoInputForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const source = detectVideoSource(url);
    if (source === "unknown") {
      toast.error("Please enter a valid YouTube, Loom, or MP4 URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: source === "mp4" ? "file" : source, source_url: url }),
      });

      const data = await res.json();

      if (res.status === 402) {
        toast.error(data.message, {
          action: { label: "Upgrade to Pro", onClick: () => router.push("/pricing") },
        });
        return;
      }

      if (!res.ok) throw new Error(data.error);

      const processRes = await fetch(`/api/jobs/${data.job.id}/process`, { method: "POST" });
      if (!processRes.ok) {
        const pd = await processRes.json();
        throw new Error(pd.error);
      }

      router.push(`/jobs/${data.job.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (uploadRes.status === 402) {
        toast.error(uploadData.message, {
          action: { label: "Upgrade to Pro", onClick: () => router.push("/pricing") },
        });
        return;
      }

      if (!uploadRes.ok) throw new Error(uploadData.error);

      const processRes = await fetch(`/api/jobs/${uploadData.job.id}/process`, { method: "POST" });
      if (!processRes.ok) {
        const pd = await processRes.json();
        throw new Error(pd.error);
      }

      router.push(`/jobs/${uploadData.job.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/mp4": [".mp4"], "video/quicktime": [".mov"], "video/webm": [".webm"], "audio/mpeg": [".mp3"], "audio/wav": [".wav"] },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex rounded-lg border border-border overflow-hidden mb-6">
        {(["url", "upload"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "url" ? <Link2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {t === "url" ? "Paste a URL" : "Upload a file"}
          </button>
        ))}
      </div>

      {tab === "url" ? (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {url.includes("youtube") || url.includes("youtu.be") ? (
                <Youtube className="h-5 w-5 text-red-500" />
              ) : url.includes("loom") ? (
                <Film className="h-5 w-5 text-purple-500" />
              ) : (
                <Link2 className="h-5 w-5" />
              )}
            </div>
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=... or Loom URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 h-12 text-base"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Supports YouTube, Loom, and direct MP4 links
          </p>
          <Button type="submit" size="xl" className="w-full" disabled={loading || !url.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing your video…
              </>
            ) : (
              "Convert to Manual →"
            )}
          </Button>
        </form>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
            loading && "pointer-events-none opacity-60"
          )}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing your video…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {isDragActive ? "Drop your file here" : "Drag & drop your video"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse — MP4, MOV, WebM, MP3, WAV
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Maximum file size: 100MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
