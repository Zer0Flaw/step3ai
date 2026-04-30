import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VideoInputForm } from "@/components/VideoInputForm";

export default async function ConvertPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Convert a Video</h1>
          <p className="text-muted-foreground">
            Paste a YouTube or Loom URL, or upload an MP4 file to get started
          </p>
        </div>
        <VideoInputForm />
      </main>
    </div>
  );
}
