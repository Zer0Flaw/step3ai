import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VidManual — Turn Any Video Into a Step-by-Step Manual",
  description:
    "Convert YouTube videos, MP4 files, and Loom recordings into professional step-by-step instruction manuals, checklists, and SOPs in seconds.",
  keywords: [
    "video to manual",
    "video to instructions",
    "SOP generator",
    "training documentation",
    "YouTube to steps",
  ],
  openGraph: {
    title: "VidManual — Turn Any Video Into a Step-by-Step Manual",
    description:
      "Convert YouTube videos, MP4 files, and Loom recordings into professional step-by-step instruction manuals.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
