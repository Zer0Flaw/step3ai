"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FREE_CONVERSION_LIMIT } from "@/lib/stripe";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  "Unlimited conversions",
  "Priority processing",
  "PDF & SOP exports",
  "Drag-to-reorder editing",
  "Email support",
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-full bg-amber-100">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <DialogTitle>You've hit your free limit</DialogTitle>
          </div>
          <DialogDescription>
            You've used all {FREE_CONVERSION_LIMIT} free conversions. Upgrade to Pro
            for unlimited access.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 my-2">
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-bold">$9</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                <Check className="h-4 w-4 text-primary flex-none" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe later
          </Button>
          <Button onClick={handleUpgrade} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Upgrade to Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
