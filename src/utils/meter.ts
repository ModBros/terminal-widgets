import { Line, LineBuilder, padEnd, padStart, repeat, truncate } from './text'

export interface MeterOptions {
  cols: number
  label: string
  labelWidth: number
  // 'htop' | 'btop' | 'blocks' | 'top'
  style: string
  valueText: string
  // minimum width of the value in front of the bar in the top style
  valueWidth?: number
  percent: number
  labelColor: string
  bracketColor: string
  emptyColor: string
  valueColor: string
  cellColor: (position: number, percent: number) => string
}

/**
 * All labels of a meter group share one width so the bars line up. A positive
 * override wins, otherwise the longest label is used.
 */
export function resolveLabelWidth(
  labels: string[],
  override: number | null
): number {
  if (labels.every((label) => !label)) {
    return 0
  }

  if (typeof override === 'number' && override > 0) {
    return Math.floor(override)
  }

  return Math.max(...labels.map((label) => label.length))
}

const partialBlocks = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']

function appendBar(line: LineBuilder, width: number, options: MeterOptions) {
  const { style, percent, emptyColor, cellColor } = options
  const exact = percent * width

  if (style === 'blocks') {
    const full = Math.floor(exact)
    const partial = partialBlocks[Math.floor((exact - full) * 8)]

    for (let i = 0; i < width; i++) {
      const color = cellColor((i + 0.5) / width, percent)

      if (i < full) {
        line.append('█', { color })
      } else if (i === full && partial) {
        line.append(partial, { color })
      } else {
        line.append(' ')
      }
    }

    return
  }

  const filled = Math.round(exact)

  for (let i = 0; i < width; i++) {
    line.append('■', {
      color: i < filled ? cellColor((i + 0.5) / width, percent) : emptyColor
    })
  }
}

// wide enough for "100.0%", so the bar does not move while the value changes
export const minTopValueWidth = 6

function buildTopMeter(line: LineBuilder, options: MeterOptions): Line {
  const { cols, valueText, percent } = options
  const width = Math.max(valueText.length, options.valueWidth ?? 0)

  if (width > 0) {
    line
      .append(line.length > 0 ? ' ' : '')
      .append(padStart(valueText, width), { color: options.valueColor })
      .append(' ')
  } else if (line.length > 0) {
    line.append(' ')
  }

  const inner = Math.max(0, cols - line.length - 2)
  const filled = Math.round(percent * inner)

  line.append('[', { color: options.bracketColor })

  for (let i = 0; i < inner; i++) {
    if (i < filled) {
      line.append('|', { color: options.cellColor((i + 0.5) / inner, percent) })
    } else {
      line.append(' ')
    }
  }

  line.append(']', { color: options.bracketColor })

  return line.padTo(cols).build()
}

/**
 * htop:   CPU[||||||||||         42.1%]
 * btop:   CPU ■■■■■■■■■■■■■■■■■■■ 42.1%
 * blocks: CPU ████████▌           42.1%
 * top:    CPU  42.1% [||||||||||           ]
 */
export function buildMeter(options: MeterOptions): Line {
  const { cols, label, labelWidth, style, valueText, percent } = options
  const line = new LineBuilder()

  if (labelWidth > 0) {
    line.append(padEnd(label, labelWidth), { color: options.labelColor })
  }

  if (style === 'top') {
    return buildTopMeter(line, options)
  }

  if (style === 'btop' || style === 'blocks') {
    const gap = labelWidth > 0 ? 1 : 0
    const valuePart = valueText ? ` ${valueText}` : ''
    const barWidth = Math.max(0, cols - line.length - gap - valuePart.length)

    line.append(repeat(' ', gap))
    appendBar(line, barWidth, options)
    line.append(truncate(valuePart, cols - line.length), {
      color: options.valueColor
    })

    return line.padTo(cols).build()
  }

  const inner = Math.max(0, cols - line.length - 2)
  const text = truncate(valueText, inner)
  const filled = Math.round(percent * inner)

  line.append('[', { color: options.bracketColor })

  for (let i = 0; i < inner; i++) {
    const textIndex = i - (inner - text.length)

    if (textIndex >= 0) {
      line.append(text[textIndex], { color: options.valueColor })
    } else if (i < filled) {
      line.append('|', { color: options.cellColor((i + 0.5) / inner, percent) })
    } else {
      line.append(' ')
    }
  }

  line.append(']', { color: options.bracketColor })

  return line.padTo(cols).build()
}
