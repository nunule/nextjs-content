interface PlainTextContentProps {
  content: string
}

function splitParagraphs(content: string) {
  return content
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function PlainTextContent({ content }: PlainTextContentProps) {
  return (
    <div>
      {splitParagraphs(content).map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 20)}`} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  )
}
