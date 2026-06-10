import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AiTutor — 全双工多模态 AI 助手",
  description: "开口即对话、随时可打断的移动端多模态 AI 助手，支持语音、文字与图片提问",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AiTutor",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#110f0d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
