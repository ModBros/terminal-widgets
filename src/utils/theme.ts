import { useMemo } from 'react'
import { useSelectField } from '@modbros/dashboard-sdk'
import {
  defaultBoxColor,
  defaultBracketColor,
  defaultDimColor,
  defaultHeaderBackgroundColor,
  defaultHeaderTextColor,
  defaultHighColor,
  defaultHighlightBackgroundColor,
  defaultHighlightTextColor,
  defaultLowColor,
  defaultMidColor,
  defaultPromptColor,
  defaultTextColor,
  defaultTitleColor,
  defaultValueColor,
  monoDimColor,
  monoReverseTextColor,
  monoTextColor
} from './constants'

export interface ThemeColors {
  text: string
  dim: string
  box: string
  title: string
  bracket: string
  value: string
  prompt: string
  low: string
  mid: string
  high: string
  headerText: string
  headerBackground: string
  highlightText: string
  highlightBackground: string
}

const colorTheme: ThemeColors = {
  text: defaultTextColor,
  dim: defaultDimColor,
  box: defaultBoxColor,
  title: defaultTitleColor,
  bracket: defaultBracketColor,
  value: defaultValueColor,
  prompt: defaultPromptColor,
  low: defaultLowColor,
  mid: defaultMidColor,
  high: defaultHighColor,
  headerText: defaultHeaderTextColor,
  headerBackground: defaultHeaderBackgroundColor,
  highlightText: defaultHighlightTextColor,
  highlightBackground: defaultHighlightBackgroundColor
}

const monoTheme: ThemeColors = {
  text: monoTextColor,
  dim: monoDimColor,
  box: monoTextColor,
  title: monoTextColor,
  bracket: monoTextColor,
  value: monoTextColor,
  prompt: monoTextColor,
  low: monoTextColor,
  mid: monoTextColor,
  high: monoTextColor,
  headerText: monoReverseTextColor,
  headerBackground: monoTextColor,
  highlightText: monoReverseTextColor,
  highlightBackground: monoTextColor
}

/**
 * The default colors of the selected theme. They only fill in the color
 * fields the user left empty, so single colors can still be changed.
 */
export function useThemeColors(): ThemeColors {
  const theme = useSelectField({ field: 'theme', defaultValue: 'color' })

  return useMemo(() => (theme === 'mono' ? monoTheme : colorTheme), [theme])
}
