import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRD Reviewer - AI驱动的产品需求文档检查工具",
  description: "用AI检查PRD文档中的逻辑遗漏、边界问题，提升文档质量",
  openGraph: {
    title: "PRD Reviewer - AI驱动的产品需求文档检查工具",
    description: "用AI检查PRD文档中的逻辑遗漏、边界问题，提升文档质量",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
