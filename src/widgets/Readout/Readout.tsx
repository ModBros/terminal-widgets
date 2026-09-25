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
import { joinValue, useMetricReading } from '../../utils/metric'
import { LineBuilder, repeat } from '../../utils/text'
import { useThemeColors } from '../../utils/theme'

const Readout: FunctionComponent = () => {
  const font = useTerminalFont()
  const theme = useThemeColors()
  const { cols } = useTerminalGrid(font)
  const metricConfigured = useIsMetricFieldConfigured({ field: 'metric' })
  const customLabel = useStringField({ field: 'label' })
  const hideLabel = useCheckboxField({ field: 'hide_label' })
  const separator = useStringField({ field: 'separator', defaultValue: ': ' })
  const prefix = useStringField({ field: 'prefix' })
  const align = useSelectField({ field: 'align', defaultValue: 'left' })
  const leader = useStringField({ field: 'leader' })
  const showCursor = useCheckboxField({ field: 'show_cursor' })
  const hideUnit = useCheckboxField({ field: 'hide_unit' })
  const precision = useNumberField({ field: 'precision' })
  const promptColor = useColorField({
    field: 'prompt_color',
    defaultColor: theme.prompt
  })
  const textColor = useColorField({
    field: 'text_color',
    defaultColor: theme.text
  })
  const valueColor = useColorField({
    field: 'value_color',
    defaultColor: theme.value
  })
  const cursorColor = useColorField({
    field: 'cursor_color',
    defaultColor: theme.text
  })
  const reading = useMetricReading({ field: 'metric', precision, max: null })

  if (!metricConfigured) {
    return <MissingConfigPlaceholder text={'Please provide a metric'} />
  }

  if (!reading.ready) {
    return <Loading />
  }

  const prefixText = prefix ?? ''
  const labelText = hideLabel
    ? ''
    : `${customLabel || reading.name}${separator ?? ''}`
  const valueText = hideUnit
    ? reading.text
    : joinValue(reading.text, reading.unit)
  const cursorText = showCursor ? '█' : ''
  const contentLength =
    prefixText.length + labelText.length + valueText.length + cursorText.length
  const free = Math.max(0, cols - contentLength)

  const line = new LineBuilder()

  if (align === 'right') {
    line.append(repeat(' ', free))
  }

  line
    .append(prefixText, { color: promptColor.toRgbaCss() })
    .append(labelText, { color: textColor.toRgbaCss() })

  if (align === 'spread') {
    line.append(repeat((leader || ' ').charAt(0), free), {
      color: textColor.toRgbaCss()
    })
  }

  line
    .append(valueText, { color: valueColor.toRgbaCss() })
    .append(cursorText, { color: cursorColor.toRgbaCss(), blink: true })

  // shrink the text instead of cutting it off when it does not fit
  const screenCols = Math.max(cols, contentLength)

  return (
    <Screen font={font} cols={screenCols} rows={1}>
      <Lines font={font} lines={[line.padTo(screenCols).build()]} />
    </Screen>
  )
}

export default Readout
