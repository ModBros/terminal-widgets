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

let measureElement: HTMLSpanElement | null = null

// measured in the DOM like the rendered text: on Android, canvas text can pick
// a different fallback font than the DOM for box drawing glyphs
function measureTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number
): number {
  if (!measureElement) {
    measureElement = document.createElement('span')
    measureElement.setAttribute('aria-hidden', 'true')
    Object.assign(measureElement.style, {
      position: 'absolute',
      left: '-10000px',
      top: '0',
      visibility: 'hidden',
      whiteSpace: 'pre',
      fontVariantLigatures: 'none'
    })
    document.body.appendChild(measureElement)
  }

  measureElement.style.fontFamily = fontFamily
  measureElement.style.fontSize = `${fontSize}px`
  measureElement.textContent = text

  return measureElement.getBoundingClientRect().width
}

// averaged over 100 characters, so layout rounding stays below the tolerance
function measureCharWidth(
  char: string,
  fontFamily: string,
  fontSize: number
): number {
  return measureTextWidth(char.repeat(100), fontFamily, fontSize) / 100
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
      const width = measureCharWidth(char, fontFamily, fontSize)

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
      const measured = measureCharWidth('M', fontFamily, fontSize)
      const charWidth = measured > 0 ? measured : fontSize * 0.6

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
