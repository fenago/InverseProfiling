import { Fragment } from 'react'

/**
 * Simple markdown-like formatting for chat messages
 * Supports: **bold**, *italic*, `code`, ```code blocks```, and URLs
 */

// URL regex pattern
const URL_PATTERN = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g

interface FormattedPart {
  type: 'text' | 'bold' | 'italic' | 'code' | 'codeblock' | 'link'
  content: string
  language?: string
}

function parseInlineFormatting(text: string): FormattedPart[] {
  const parts: FormattedPart[] = []
  let lastIndex = 0

  // Create a combined regex for all inline patterns
  const combinedPattern = new RegExp(
    `(${URL_PATTERN.source})|` +
    `(\`[^\`]+\`)|` +
    `(\\*\\*[^*]+\\*\\*)|` +
    `((?<!\\*)\\*[^*]+\\*(?!\\*))`,
    'g'
  )

  let match: RegExpExecArray | null
  while ((match = combinedPattern.exec(text)) !== null) {
    // Add any text before this match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      })
    }

    const fullMatch = match[0]

    if (fullMatch.startsWith('http://') || fullMatch.startsWith('https://')) {
      // URL
      parts.push({
        type: 'link',
        content: fullMatch
      })
    } else if (fullMatch.startsWith('`') && !fullMatch.startsWith('```')) {
      // Inline code
      parts.push({
        type: 'code',
        content: fullMatch.slice(1, -1)
      })
    } else if (fullMatch.startsWith('**')) {
      // Bold
      parts.push({
        type: 'bold',
        content: fullMatch.slice(2, -2)
      })
    } else if (fullMatch.startsWith('*')) {
      // Italic
      parts.push({
        type: 'italic',
        content: fullMatch.slice(1, -1)
      })
    }

    lastIndex = match.index + fullMatch.length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

function renderPart(part: FormattedPart, index: number, isUserMessage: boolean): React.ReactNode {
  switch (part.type) {
    case 'bold':
      return <strong key={index} className="font-semibold">{part.content}</strong>
    case 'italic':
      return <em key={index} className="italic">{part.content}</em>
    case 'code':
      return (
        <code
          key={index}
          className={
            isUserMessage
              ? 'bg-primary-700/50 px-1.5 py-0.5 rounded text-sm font-mono'
              : 'bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono'
          }
        >
          {part.content}
        </code>
      )
    case 'link':
      return (
        <a
          key={index}
          href={part.content}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isUserMessage
              ? 'underline hover:opacity-80'
              : 'text-primary-600 hover:text-primary-700 underline'
          }
        >
          {part.content}
        </a>
      )
    case 'text':
    default:
      return <Fragment key={index}>{part.content}</Fragment>
  }
}

interface CodeBlockProps {
  language?: string
  code: string
  isUserMessage: boolean
}

function CodeBlock({ language, code, isUserMessage }: CodeBlockProps) {
  return (
    <div className="my-2">
      {language && (
        <div
          className={
            isUserMessage
              ? 'text-xs text-primary-200 px-3 py-1 bg-primary-700/30 rounded-t-lg'
              : 'text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded-t-lg border border-b-0 border-gray-200'
          }
        >
          {language}
        </div>
      )}
      <pre
        className={
          isUserMessage
            ? `bg-primary-700/40 p-3 overflow-x-auto text-sm font-mono ${language ? 'rounded-b-lg' : 'rounded-lg'}`
            : `bg-gray-50 p-3 overflow-x-auto text-sm font-mono border border-gray-200 ${language ? 'rounded-b-lg' : 'rounded-lg'}`
        }
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}

interface FormattedMessageProps {
  content: string
  isUserMessage: boolean
}

export function FormattedMessage({ content, isUserMessage }: FormattedMessageProps) {
  // First, split by code blocks
  const segments: Array<{ type: 'text' | 'codeblock'; content: string; language?: string }> = []
  let lastIndex = 0

  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }

    // Add code block
    segments.push({
      type: 'codeblock',
      content: match[2],
      language: match[1]
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }

  // If no segments, treat entire content as text
  if (segments.length === 0) {
    segments.push({ type: 'text', content })
  }

  return (
    <div className="space-y-1">
      {segments.map((segment, segmentIndex) => {
        if (segment.type === 'codeblock') {
          return (
            <CodeBlock
              key={segmentIndex}
              language={segment.language}
              code={segment.content}
              isUserMessage={isUserMessage}
            />
          )
        }

        // Split text by paragraphs (double newlines) and single newlines
        const paragraphs = segment.content.split(/\n\n+/)

        return paragraphs.map((paragraph, pIndex) => {
          const lines = paragraph.split('\n')

          return (
            <p key={`${segmentIndex}-${pIndex}`} className={pIndex > 0 ? 'mt-2' : ''}>
              {lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {parseInlineFormatting(line).map((part, partIndex) =>
                    renderPart(part, partIndex, isUserMessage)
                  )}
                </Fragment>
              ))}
            </p>
          )
        })
      })}
    </div>
  )
}
