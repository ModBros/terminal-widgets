import { useMemo } from 'react'
import { interpolateRgb, piecewise } from 'd3-interpolate'
import {
  useColorField,
  useNumberField,
  useSelectField
} from '@modbros/dashboard-sdk'
import { defaultCriticalThreshold, defaultWarningThreshold } from './constants'
import { useThemeColors } from './theme'
import { clamp } from './text'

export interface LevelColors {
  /**
   * Color of a cell located at `position` (0..1) along a bar or graph.
   * `percent` (0..1) is the level the threshold mode compares against.
   */
  cellColor: (position: number, percent: number) => string
}

export function useLevelColors(): LevelColors {
  const theme = useThemeColors()
  const low = useColorField({
    field: 'color',
    defaultColor: theme.low
  }).toRgbaCss()
  const mid = useColorField({
    field: 'warning_color',
    defaultColor: theme.mid
  }).toRgbaCss()
  const high = useColorField({
    field: 'critical_color',
    defaultColor: theme.high
  }).toRgbaCss()
  const mode = useSelectField({ field: 'color_mode', defaultValue: 'gradient' })
  const warning = useNumberField({
    field: 'warning_threshold',
    defaultValue: defaultWarningThreshold
  })
  const critical = useNumberField({
    field: 'critical_threshold',
    defaultValue: defaultCriticalThreshold
  })

  return useMemo(() => {
    const gradient = piecewise(interpolateRgb, [low, mid, high])

    const thresholdColor = (percent: number) => {
      const value = percent * 100

      if (critical !== null && value >= critical) {
        return high
      }

      if (warning !== null && value >= warning) {
        return mid
      }

      return low
    }

    return {
      cellColor(position: number, percent: number) {
        switch (mode) {
          case 'solid':
            return low

          case 'threshold':
            return thresholdColor(percent)

          default:
            return gradient(clamp(position, 0, 1))
        }
      }
    }
  }, [low, mid, high, mode, warning, critical])
}
