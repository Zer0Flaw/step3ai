"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Loader2 } from "lucide-react";
import { FREE_CONVERSION_LIMIT } from "@/lib/stripe";

const FREE_FEATURES = [
  `${FREE_CONVERSION_LIMIT} video conversions`,
  "Step-by-step view",
  "Checklist view",
  "PDF export",
  "SOP markdown export",
];

const PRO_FEATURES = [
  "Unlimited conversions",
  "All free features",
  "Priority processing",
  "Drag-to-reorder editing",
  "Email support",
  "Early access to new features",
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Simple pricing</h1>
          <p className="text-xl text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Free</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-none" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-up">Get started free</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/50 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="gap-1">
                <Zap className="h-3 w-3" />
                Most popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Pro</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary flex-none" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={handleUpgrade} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-10 text-sm text-muted-foreground">
          <p>Cancel anytime. No hidden fees. All prices in USD.</p>
        </div>
      </main>
    </div>
  );
}
