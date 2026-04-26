export function getPlainTextFromHtml(html: string): string {
  if (!html) return "";

  if (
    typeof window !== "undefined" &&
    typeof window.DOMParser !== "undefined"
  ) {
    const doc = new window.DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
