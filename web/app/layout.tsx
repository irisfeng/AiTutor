import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Use Inter font with swap display for better loading
const font = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "AiTutor - 实时 AI 语音助手",
  description: "基于 StepFun Realtime API 的实时语音交互应用",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={font.className}>{children}</body>
    </html>
  );
}
