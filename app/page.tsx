"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Youtube,
  Film,
  FileText,
  CheckSquare,
  Download,
  Zap,
  ArrowRight,
  Play,
  BookOpen,
  Wrench,
  GraduationCap,
  Monitor,
  Loader2,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FREE_CONVERSION_LIMIT } from "@/lib/stripe";

const USE_CASES = [
  { icon: Monitor, label: "IT & SysAdmin", description: "Document complex setup procedures, server configs, and deployment workflows" },
  { icon: GraduationCap, label: "Training & L&D", description: "Turn onboarding videos into structured guides your team can follow and reference" },
  { icon: Wrench, label: "DIY & How-to", description: "Convert YouTube tutorials into step-by-step instructions you can print and use" },
  { icon: BookOpen, label: "Education", description: "Transform lecture videos into study guides and revision checklists" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Paste a URL or upload", description: "Drop in a YouTube link, Loom recording, or upload your MP4 file", icon: Youtube },
  { step: 2, title: "AI extracts the steps", description: "Our AI transcribes the audio and organizes content into clear, logical steps", icon: Zap },
  { step: 3, title: "Edit, export, and share", description: "Rename steps, reorder them, then download a PDF manual or SOP markdown", icon: Download },
];

const EXAMPLE_OUTPUTS = [
  { label: "Step-by-step guide", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
  { label: "Printable checklist", color: "bg-green-50 border-green-200", textColor: "text-green-700" },
  { label: "PDF manual", color: "bg-purple-50 border-purple-200", textColor: "text-purple-700" },
  { label: "SOP document", color: "bg-amber-50 border-amber-200", textColor: "text-amber-700" },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDone, setEmailDone] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setEmailDone(true);
      setEmail("");
      toast.success("You're on the list! We'll be in touch.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center relative">
          <Badge variant="secondary" className="mb-4 text-sm gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Powered by GPT-4o & Whisper
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Turn any video into a
            <br />
            <span className="text-primary">step-by-step manual</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Paste a YouTube link, upload an MP4, or share a Loom — and get a
            professional instruction manual, checklist, and SOP in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="xl" className="gap-2">
              <Link href="/sign-up">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="gap-2">
              <Link href="/sign-in">
                <Play className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {FREE_CONVERSION_LIMIT} free conversions · No credit card required
          </p>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {[
            { icon: Youtube, label: "YouTube" },
            { icon: Film, label: "Loom" },
            { icon: FileText, label: "MP4 files" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </div>
          ))}
          <span>→</span>
          {EXAMPLE_OUTPUTS.map(({ label, color, textColor }) => (
            <span
              key={label}
              className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${color} ${textColor}`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Step {step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">Built for every use case</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Whether you're in IT, training, education, or just love DIY projects,
            VidManual turns any video into clear, actionable documentation.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {USE_CASES.map(({ icon: Icon, label, description }) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-3">What you get with every conversion</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 text-sm">
            {[
              { icon: FileText, label: "Step-by-step guide" },
              { icon: CheckSquare, label: "Interactive checklist" },
              { icon: Download, label: "Downloadable PDF" },
              { icon: FileText, label: "SOP markdown" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 bg-background rounded-lg p-3 border">
                <Icon className="h-4 w-4 text-primary flex-none" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 border-y">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          {emailDone ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">You're on the list!</h2>
              <p className="text-muted-foreground">We'll email you when new features drop.</p>
              <Button asChild className="mt-2">
                <Link href="/sign-up">Start converting videos now</Link>
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Stay in the loop</h2>
              <p className="text-muted-foreground mb-6">
                Get notified about new features, templates, and integrations.
              </p>
              <form onSubmit={handleWaitlist} className="flex gap-2 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={emailLoading}>
                  {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
                </Button>
              </form>
            </>
          )}
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">VidManual</span>
          </div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/sign-up" className="hover:text-foreground">Sign up</Link>
          </div>
          <p>© {new Date().getFullYear()} VidManual. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
