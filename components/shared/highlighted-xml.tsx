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
          theme: "github-light",
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
        <div className="h-4 bg-muted rounded mb-2"></div>
        <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-muted rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-muted rounded mb-2 w-2/3"></div>
        <div className="h-4 bg-muted rounded mb-2 w-1/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-auto [&_pre]:bg-transparent [&_pre]:border-0 [&_pre]:p-0 [&_pre]:m-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
}
