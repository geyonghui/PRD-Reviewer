import { useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";

interface Props {
  content: string;
  highlightedSection?: string;
}

export default function MarkdownViewer({ content, highlightedSection }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<Element | null>(null);

  const clearPrev = useCallback(() => {
    if (prevRef.current) {
      (prevRef.current as HTMLElement).style.backgroundColor = "";
      (prevRef.current as HTMLElement).style.borderRadius = "";
      (prevRef.current as HTMLElement).style.padding = "";
      (prevRef.current as HTMLElement).style.marginLeft = "";
      (prevRef.current as HTMLElement).style.marginRight = "";
      (prevRef.current as HTMLElement).style.transition = "";
      prevRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!highlightedSection || !containerRef.current) return;
    clearPrev();
    const headings = containerRef.current.querySelectorAll("h1, h2, h3");
    for (const h of headings) {
      if (h.textContent?.trim() === highlightedSection) {
        const el = h as HTMLElement;
        el.style.backgroundColor = "rgba(250, 204, 21, 0.25)";
        el.style.borderRadius = "6px";
        el.style.padding = "2px 8px";
        el.style.marginLeft = "-8px";
        el.style.marginRight = "-8px";
        el.style.transition = "background-color 0.3s ease";
        prevRef.current = h;
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        // 淡出效果
        setTimeout(() => {
          if (prevRef.current === h) {
            (h as HTMLElement).style.backgroundColor = "rgba(250, 204, 21, 0)";
            setTimeout(clearPrev, 500);
          }
        }, 2000);
        break;
      }
    }
    return clearPrev;
  }, [highlightedSection, clearPrev]);

  return (
    <div ref={containerRef} className="prose dark:prose-invert max-w-none prose-headings:scroll-margin-top-[80px]">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkSlug as any]}>{content}</ReactMarkdown>
    </div>
  );
}
