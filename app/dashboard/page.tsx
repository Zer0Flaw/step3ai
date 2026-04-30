import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FREE_CONVERSION_LIMIT } from "@/lib/stripe";
import { Plus, Film, Youtube, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

type JobStatus = "pending" | "transcribing" | "extracting" | "done" | "error";

interface JobSummary {
  id: string;
  title: string;
  status: JobStatus;
  source_type: string;
  thumbnail_url: string | null;
  created_at: string;
  estimated_time: string | null;
  error_message: string | null;
}

interface UserUsageSummary {
  conversion_count: number;
  plan: "free" | "pro";
}

const STATUS_MAP: Record<
  JobStatus,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pending", variant: "secondary" },
  transcribing: { label: "Transcribing…", variant: "warning" },
  extracting: { label: "Extracting steps…", variant: "warning" },
  done: { label: "Ready", variant: "success" },
  error: { label: "Error", variant: "destructive" },
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = createServiceClient();

  const [{ data: jobsRaw }, { data: usageRaw }] = await Promise.all([
    db
      .from("jobs")
      .select("id, title, status, source_type, thumbnail_url, created_at, estimated_time, error_message")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    db.from("user_usage").select("conversion_count, plan").eq("user_id", userId).single(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobs = (jobsRaw ?? []) as unknown as JobSummary[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usage = usageRaw as unknown as UserUsageSummary | null;

  const plan = usage?.plan ?? "free";
  const count = usage?.conversion_count ?? 0;
  const remaining = plan === "pro" ? null : Math.max(0, FREE_CONVERSION_LIMIT - count);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Manuals</h1>
            {plan === "free" && remaining !== null && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {remaining > 0
                  ? `${remaining} free conversion${remaining === 1 ? "" : "s"} remaining`
                  : "Free limit reached — "}
                {remaining === 0 && (
                  <Link href="/pricing" className="text-primary hover:underline">
                    upgrade to Pro
                  </Link>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {plan === "free" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href="/convert">
                <Plus className="h-4 w-4" />
                New Manual
              </Link>
            </Button>
          </div>
        </div>

        {!jobs.length ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">No manuals yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Convert your first video into a step-by-step manual
            </p>
            <Button asChild>
              <Link href="/convert">
                <Plus className="h-4 w-4" />
                Convert a video
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job) => {
              const statusInfo = STATUS_MAP[job.status];
              return (
                <Link key={job.id} href={job.status === "done" ? `/jobs/${job.id}` : "#"}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-none w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {job.source_type === "youtube" ? (
                          <Youtube className="h-5 w-5 text-red-500" />
                        ) : (
                          <Film className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{job.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(job.created_at)}
                          </span>
                          {job.estimated_time && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {job.estimated_time}
                            </span>
                          )}
                        </div>
                        {job.status === "error" && job.error_message && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {job.error_message}
                          </p>
                        )}
                      </div>

                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
