import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "PRD Reviewer - AI驱动的产品需求文档检查工具",
  description: "用AI检查PRD文档中的逻辑遗漏、边界问题，提升文档质量",
  openGraph: {
    title: "PRD Reviewer - AI驱动的产品需求文档检查工具",
    description: "用AI检查PRD文档中的逻辑遗漏、边界问题，提升文档质量",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <nav className="fixed top-0 right-0 p-4 z-50">
            <ThemeToggle />
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
