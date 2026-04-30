import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { ManualViewer } from "@/components/ManualViewer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Job, JobSection, JobStep } from "@/types/database";

interface SectionWithSteps extends Omit<JobSection, "job_id"> {
  job_steps: JobStep[];
}

interface JobPageProps {
  params: { id: string };
}

export default async function JobPage({ params }: JobPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = createServiceClient();

  const { data: jobRaw } = await db
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!jobRaw) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = jobRaw as unknown as Job;

  if (job.status !== "done" && job.status !== "error") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {job.status === "transcribing" ? "Transcribing your video…" : "Extracting steps…"}
          </h2>
          <p className="text-muted-foreground text-sm">
            This usually takes 30–90 seconds depending on video length.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Refresh this page to check progress.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (job.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Processing failed</h2>
          <p className="text-muted-foreground text-sm">{job.error_message}</p>
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link href="/convert">Try again</Link>
          </Button>
        </main>
      </div>
    );
  }

  const { data: sectionsRaw } = await db
    .from("job_sections")
    .select("*, job_steps(*)")
    .eq("job_id", params.id)
    .order("order_index");

  const sections: SectionWithSteps[] = ((sectionsRaw ?? []) as unknown as Array<JobSection & { job_steps: JobStep[] }>).map((s) => ({
    id: s.id,
    title: s.title,
    order_index: s.order_index,
    created_at: s.created_at,
    job_steps: s.job_steps ?? [],
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>

        <ManualViewer job={job} sections={sections} />
      </main>
    </div>
  );
}
