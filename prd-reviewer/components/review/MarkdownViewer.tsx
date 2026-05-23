"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";

export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none prose-headings:scroll-margin-top-[80px]">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkSlug as any]}>{content}</ReactMarkdown>
    </div>
  );
}
