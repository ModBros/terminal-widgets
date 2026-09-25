import { clamp, Line } from './text'

export interface GraphOptions {
  samples: number[]
  cols: number
  rows: number
  min: number
  max: number
  // 'braille' | 'blocks'
  style: string
  cellColor: (position: number, percent: number) => string
}

// braille dot bits, ordered bottom to top
const brailleLeft = [0x40, 0x04, 0x02, 0x01]
const brailleRight = [0x80, 0x20, 0x10, 0x08]
const blockLevels = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export function samplesPerColumn(style: string): number {
  return style === 'blocks' ? 1 : 2
}

/**
 * Renders a scrolling history graph. Braille characters give two samples per
 * column and four vertical steps per row (like btop), blocks give one sample
 * per column and eight vertical steps per row.
 */
export function buildGraph(options: GraphOptions): Line[] {
  const { samples, cols, rows, min, max, style, cellColor } = options
  const braille = style !== 'blocks'
  const perColumn = samplesPerColumn(style)
  const stepsPerRow = braille ? 4 : 8
  const total = cols * perColumn
  const range = max - min > 0 ? max - min : 1

  // filled steps per sample slot, right aligned so new values enter on the right
  const levels: number[] = new Array(total).fill(0)
  const visible = samples.slice(-total)
  const offset = total - visible.length

  visible.forEach((sample, index) => {
    const normalized = clamp((sample - min) / range, 0, 1)
    const level = Math.round(normalized * rows * stepsPerRow)

    // keep any value above the minimum visible
    levels[offset + index] = normalized > 0 ? Math.max(1, level) : 0
  })

  const lines: Line[] = []

  for (let row = 0; row < rows; row++) {
    const base = (rows - 1 - row) * stepsPerRow
    const position = (rows - row - 0.5) / rows
    let text = ''

    for (let col = 0; col < cols; col++) {
      if (!braille) {
        text += blockLevels[clamp(levels[col] - base, 0, 8)]
        continue
      }

      let bits = 0
      const left = clamp(levels[col * 2] - base, 0, 4)
      const right = clamp(levels[col * 2 + 1] - base, 0, 4)

      for (let dot = 0; dot < left; dot++) {
        bits |= brailleLeft[dot]
      }

      for (let dot = 0; dot < right; dot++) {
        bits |= brailleRight[dot]
      }

      text += String.fromCharCode(0x2800 + bits)
    }

    lines.push([{ text, color: cellColor(position, position) }])
  }

  return lines
}
