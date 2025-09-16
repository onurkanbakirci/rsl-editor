"use client";

import { useEffect, useState } from "react";
import { getHighlighter, type Highlighter } from "shiki";

interface HighlightedXmlProps {
  code: string;
  className?: string;
}

export function HighlightedXml({ code, className = "" }: HighlightedXmlProps) {
  const [highlightedCode, setHighlightedCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let highlighter: Highlighter;

    async function highlight() {
      try {
        highlighter = await getHighlighter({
          themes: ["github-light", "github-dark"],
          langs: ["xml"],
        });

        const highlighted = highlighter.codeToHtml(code, {
          lang: "xml",
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultColor: false,
        });

        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        // Fallback to plain text
        setHighlightedCode(`<pre><code>${code}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    }

    if (code) {
      highlight();
    }

    return () => {
      if (highlighter) {
        highlighter.dispose?.();
      }
    };
  }, [code]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="mb-2 h-4 rounded bg-muted"></div>
        <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
        <div className="mb-2 h-4 w-1/2 rounded bg-muted"></div>
        <div className="mb-2 h-4 w-2/3 rounded bg-muted"></div>
        <div className="mb-2 h-4 w-1/3 rounded bg-muted"></div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto overflow-y-auto [&_pre]:m-0 [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
}
