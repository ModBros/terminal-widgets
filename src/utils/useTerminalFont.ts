import { useEffect, useMemo, useState } from 'react'
import {
  useFontField,
  useItemSize,
  useNumberField
} from '@modbros/dashboard-sdk'
import {
  defaultFontFamily,
  defaultFontSize,
  lineHeightFactor
} from './constants'

export interface TerminalFont {
  fontFamily: string
  fontSize: number
  charWidth: number
  lineHeight: number
  // whether a character renders exactly one cell wide as plain text
  fitsCell: (char: string) => boolean
}

export interface TerminalGrid {
  cols: number
  rows: number
}

let measureCanvas: HTMLCanvasElement | null = null

function getMeasureContext(
  fontFamily: string,
  fontSize: number
): CanvasRenderingContext2D | null {
  measureCanvas = measureCanvas ?? document.createElement('canvas')
  const context = measureCanvas.getContext('2d')

  if (context) {
    // an unparsable font is ignored by the canvas and would keep the font of
    // the previous measurement, so start from a known one
    context.font = `${fontSize}px monospace`
    context.font = `${fontSize}px ${fontFamily}`
  }

  return context
}

function measureCharWidth(fontFamily: string, fontSize: number): number {
  const fallback = fontSize * 0.6
  const context = getMeasureContext(fontFamily, fontSize)

  if (!context) {
    return fallback
  }

  const width = context.measureText('M'.repeat(100)).width / 100

  return width > 0 ? width : fallback
}

/**
 * Box drawing, block and braille glyphs missing from the font come from a
 * fallback font with a different advance width. Those need a cell of their
 * own, all others can stay in plain text runs, which keeps the number of
 * rendered elements low.
 */
function createCellCheck(
  fontFamily: string,
  fontSize: number,
  charWidth: number
): (char: string) => boolean {
  const cache = new Map<string, boolean>()

  return (char) => {
    let fits = cache.get(char)

    if (fits === undefined) {
      const context = getMeasureContext(fontFamily, fontSize)
      const width = context ? context.measureText(char).width : 0

      fits = Math.abs(width - charWidth) < 0.01
      cache.set(char, fits)
    }

    return fits
  }
}

// font names are quoted, so names like "3270 Nerd Font" stay valid CSS
function quoteFontFamily(font: string): string {
  return `"${font.replace(/["\\]/g, '')}"`
}

// increments whenever the browser finished loading fonts, so character
// metrics get re-measured once a web font is available
function useFontsLoadedVersion(): number {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const fonts = document.fonts

    if (!fonts) {
      return
    }

    let active = true
    const onLoaded = () => {
      if (active) {
        setVersion((prev) => prev + 1)
      }
    }

    fonts.addEventListener('loadingdone', onLoaded)
    fonts.ready.then(onLoaded).catch(() => undefined)

    return () => {
      active = false
      fonts.removeEventListener('loadingdone', onLoaded)
    }
  }, [])

  return version
}

export function useTerminalFont(): TerminalFont {
  const font = useFontField({ field: 'font' })
  const fontSizeValue = useNumberField({
    field: 'font_size',
    defaultValue: defaultFontSize
  })
  const fontsVersion = useFontsLoadedVersion()

  const fontSize =
    fontSizeValue && fontSizeValue > 0 ? fontSizeValue : defaultFontSize
  const fontFamily = font
    ? `${quoteFontFamily(font)}, monospace`
    : defaultFontFamily

  return useMemo(
    () => {
      const charWidth = measureCharWidth(fontFamily, fontSize)

      return {
        fontFamily,
        fontSize,
        charWidth,
        lineHeight: Math.round(fontSize * lineHeightFactor),
        fitsCell: createCellCheck(fontFamily, fontSize, charWidth)
      }
    },
    // fontsVersion forces a re-measure after fonts finished loading
    [fontFamily, fontSize, fontsVersion]
  )
}

export function useTerminalGrid(font: TerminalFont): TerminalGrid {
  const { width, height } = useItemSize()

  return {
    cols: Math.max(1, Math.floor(width / font.charWidth)),
    rows: Math.max(1, Math.floor(height / font.lineHeight))
  }
}

/**
 * The columns to lay out `neededRows` rows in. If they do not fit, the screen
 * shrinks them evenly, which leaves room for more columns, so the lines still
 * span the full widget width.
 */
export function fitRows(grid: TerminalGrid, neededRows: number): number {
  const scale = Math.min(1, grid.rows / Math.max(1, neededRows))

  return Math.max(1, Math.floor(grid.cols / scale))
}
