import { useMemo } from "react";
import DOMPurify from "dompurify";
import { getPlainTextFromHtml } from "../lib/richText";

type RichTextContentProps = {
  content: string;
  className?: string;
  emptyText?: string;
};

function RichTextContent({
  content,
  className,
  emptyText = "No description provided.",
}: RichTextContentProps) {
  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(content || "", { USE_PROFILES: { html: true } }),
    [content],
  );

  const plainText = useMemo(
    () => getPlainTextFromHtml(sanitizedContent),
    [sanitizedContent],
  );

  if (!plainText) {
    return <p className={className}>{emptyText}</p>;
  }

  return (
    <div
      className={`sps-rich-text ${className || ""}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

export default RichTextContent;
