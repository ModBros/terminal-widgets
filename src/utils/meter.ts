import { Line, LineBuilder, padEnd, repeat, truncate } from './text'

export interface MeterOptions {
  cols: number
  label: string
  labelWidth: number
  // 'htop' | 'btop' | 'blocks'
  style: string
  valueText: string
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

/**
 * htop:   CPU[||||||||||         42.1%]
 * btop:   CPU ■■■■■■■■■■■■■■■■■■■ 42.1%
 * blocks: CPU ████████▌           42.1%
 */
export function buildMeter(options: MeterOptions): Line {
  const { cols, label, labelWidth, style, valueText, percent } = options
  const line = new LineBuilder()

  if (labelWidth > 0) {
    line.append(padEnd(label, labelWidth), { color: options.labelColor })
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
