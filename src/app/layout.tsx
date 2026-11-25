import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruthLens AI — Media Forensics & Claim Verification",
  description:
    "Production-minded consumer verification platform for inspecting suspicious images, video, audio, and news claims with calibrated signals and source evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { const saved = localStorage.getItem("truthlens_theme"); const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.classList.toggle("dark", dark); document.documentElement.dataset.theme = dark ? "dark" : "light"; } catch {}`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
