"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function Markdown({ children }: { children: string }) {
  return (
    <div className="ws-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => {
          if (
            url.startsWith("/workspace?document=") ||
            url.startsWith("/workspace/attachments?")
          )
            return url;
          try {
            const parsed = new URL(url);
            return ["https:", "http:"].includes(parsed.protocol) ? url : "";
          } catch {
            return "";
          }
        }}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("/") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" &&
            src.startsWith("/workspace/attachments?") ? (
              // Private images must use the authenticated route, never a shared image optimizer cache.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt || "Príloha"} loading="lazy" />
            ) : (
              <span>
                {alt || "Obrázok"} (obrázok vlož ako súkromnú prílohu)
              </span>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
