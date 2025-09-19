"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { getHighlighter, type Highlighter } from "shiki";

interface HighlightedXmlProps {
  code: string;
  className?: string;
}

export function HighlightedXml({ code, className = "" }: HighlightedXmlProps) {
  const [highlightedCode, setHighlightedCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    let highlighter: Highlighter;

    async function highlight() {
      const currentTheme = theme === "system" ? systemTheme : theme;
      const isDark = currentTheme === "dark";
      
      try {
        highlighter = await getHighlighter({
          themes: [isDark ? "github-dark" : "github-light"],
          langs: ["xml"],
        });

        const highlighted = highlighter.codeToHtml(code, {
          lang: "xml",
          theme: isDark ? "github-dark" : "github-light",
          transformers: [
            {
              pre(node) {
                // Use consistent dark theme background
                if (isDark) {
                  this.addClassToHast(node, 'dark-bg-theme');
                  // Use the same background as the app's dark theme
                  node.properties.style = `${node.properties.style || ''}; background-color: hsl(var(--background)) !important;`;
                }
              },
            },
          ],
        });

        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        // Fallback to plain text with basic styling
        const fallbackBg = isDark ? "bg-background" : "bg-muted";
        setHighlightedCode(`<pre class="${fallbackBg} rounded p-2"><code class="text-sm">${code}</code></pre>`);
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
  }, [code, theme, systemTheme]);

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

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDarkMode = currentTheme === "dark";
  
  return (
    <div
      className={`shiki-xml-highlight overflow-x-auto overflow-y-auto [&_pre]:m-0 [&_pre]:border-0 [&_pre]:p-0 [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:whitespace-pre-wrap [&_pre]:break-words ${isDarkMode ? '[&_pre]:!bg-background' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
}
