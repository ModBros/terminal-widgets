import React, { FunctionComponent } from 'react'
import {
  Loading,
  MissingConfigPlaceholder,
  useCheckboxField,
  useColorField,
  useIsMetricFieldConfigured,
  useNumberField,
  useSelectField,
  useStringField
} from '@modbros/dashboard-sdk'
import { Lines, Screen } from '../../components/Screen'
import { useTerminalFont, useTerminalGrid } from '../../utils/useTerminalFont'
import { useLevelColors } from '../../utils/colors'
import { buildGraph, samplesPerColumn } from '../../utils/graph'
import { joinValue, useMetricReading } from '../../utils/metric'
import { useValueHistory } from '../../utils/useValueHistory'
import { Line, LineBuilder, padEnd } from '../../utils/text'
import { useThemeColors } from '../../utils/theme'

const Graph: FunctionComponent = () => {
  const font = useTerminalFont()
  const theme = useThemeColors()
  const { cols, rows } = useTerminalGrid(font)
  const metricConfigured = useIsMetricFieldConfigured({ field: 'metric' })
  const style = useSelectField({ field: 'style', defaultValue: 'braille' })
  const minValue = useNumberField({ field: 'min' })
  const maxValue = useNumberField({ field: 'max' })
  const hideHeader = useCheckboxField({ field: 'hide_header' })
  const customLabel = useStringField({ field: 'label' })
  const precision = useNumberField({ field: 'precision' })
  const hideUnit = useCheckboxField({ field: 'hide_unit' })
  const textColor = useColorField({
    field: 'text_color',
    defaultColor: theme.text
  })
  const valueColor = useColorField({
    field: 'value_color',
    defaultColor: theme.value
  })
  const { cellColor } = useLevelColors()
  const reading = useMetricReading({
    field: 'metric',
    precision,
    max: maxValue,
    // the history needs every sample, also repeated ones
    everyUpdate: true
  })
  const history = useValueHistory(reading.channelValue)

  if (!metricConfigured) {
    return <MissingConfigPlaceholder text={'Please provide a metric'} />
  }

  if (!reading.ready) {
    return <Loading />
  }

  const graphStyle = style ?? 'braille'
  const samples = history.slice(-cols * samplesPerColumn(graphStyle))
  const min = minValue ?? 0
  const max = maxValue ?? Math.max(reading.max, ...samples)
  const lines: Line[] = []

  if (!hideHeader) {
    const value = hideUnit
      ? reading.text
      : joinValue(reading.text, reading.unit)
    const label = customLabel || reading.name

    lines.push(
      new LineBuilder()
        .append(padEnd(label, cols - value.length - 1), {
          color: textColor.toRgbaCss()
        })
        .append(' ')
        .append(value, { color: valueColor.toRgbaCss() })
        .build()
    )
  }

  lines.push(
    ...buildGraph({
      samples,
      cols,
      rows: hideHeader ? rows : Math.max(1, rows - 1),
      min,
      max,
      style: graphStyle,
      cellColor
    })
  )

  return (
    <Screen font={font} cols={cols} rows={lines.length} fill>
      <Lines font={font} lines={lines} />
    </Screen>
  )
}

export default Graph
