export interface SegmentStyle {
  color?: string
  background?: string
  blink?: boolean
  bold?: boolean
}

export interface Segment extends SegmentStyle {
  text: string
}

export type Line = Segment[]

function isSameStyle(a: SegmentStyle, b: SegmentStyle): boolean {
  return (
    a.color === b.color &&
    a.background === b.background &&
    Boolean(a.blink) === Boolean(b.blink) &&
    Boolean(a.bold) === Boolean(b.bold)
  )
}

/**
 * Builds a single line of styled text, merging adjacent segments that share
 * the same style to keep the number of rendered elements low.
 */
export class LineBuilder {
  private segments: Segment[] = []

  length = 0

  append(text: string, style: SegmentStyle = {}): this {
    if (!text) {
      return this
    }

    const last = this.segments[this.segments.length - 1]

    if (last && isSameStyle(last, style)) {
      last.text += text
    } else {
      this.segments.push({
        color: style.color,
        background: style.background,
        blink: style.blink,
        bold: style.bold,
        text
      })
    }

    this.length += text.length

    return this
  }

  appendLine(line: Line): this {
    for (const segment of line) {
      this.append(segment.text, segment)
    }

    return this
  }

  padTo(cols: number, style: SegmentStyle = {}): this {
    return this.append(repeat(' ', cols - this.length), style)
  }

  build(): Line {
    return this.segments
  }
}

export function repeat(char: string, count: number): string {
  return count > 0 ? char.repeat(Math.floor(count)) : ''
}

export function truncate(text: string, width: number): string {
  if (width <= 0) {
    return ''
  }

  return text.length > width ? text.slice(0, width) : text
}

export function padEnd(text: string, width: number): string {
  return truncate(text, width).padEnd(Math.max(0, width))
}

export function padStart(text: string, width: number): string {
  return truncate(text, width).padStart(Math.max(0, width))
}

export function withBackground(line: Line, background?: string): Line {
  if (!background) {
    return line
  }

  return line.map((segment) => ({
    ...segment,
    background: segment.background ?? background
  }))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
