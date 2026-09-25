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
import { buildMeter, resolveLabelWidth } from '../../utils/meter'
import { joinValue, useMetricReading } from '../../utils/metric'
import {
  defaultBracketColor,
  defaultDimColor,
  defaultTextColor
} from '../../utils/constants'

const Meter: FunctionComponent = () => {
  const font = useTerminalFont()
  const { cols } = useTerminalGrid(font)
  const metricConfigured = useIsMetricFieldConfigured({ field: 'metric' })
  const customLabel = useStringField({ field: 'label' })
  const hideLabel = useCheckboxField({ field: 'hide_label' })
  const labelWidth = useNumberField({ field: 'label_width' })
  const style = useSelectField({ field: 'style', defaultValue: 'htop' })
  const hideValue = useCheckboxField({ field: 'hide_value' })
  const hideUnit = useCheckboxField({ field: 'hide_unit' })
  const precision = useNumberField({ field: 'precision' })
  const max = useNumberField({ field: 'max' })
  const labelColor = useColorField({
    field: 'text_color',
    defaultColor: defaultTextColor
  })
  const valueColor = useColorField({
    field: 'value_color',
    defaultColor: defaultTextColor
  })
  const bracketColor = useColorField({
    field: 'bracket_color',
    defaultColor: defaultBracketColor
  })
  const emptyColor = useColorField({
    field: 'empty_color',
    defaultColor: defaultDimColor
  })
  const { cellColor } = useLevelColors()
  const reading = useMetricReading({ field: 'metric', precision, max })

  if (!metricConfigured) {
    return <MissingConfigPlaceholder text={'Please provide a metric'} />
  }

  if (!reading.ready) {
    return <Loading />
  }

  const label = hideLabel ? '' : customLabel || reading.name
  const valueText = hideUnit
    ? reading.text
    : joinValue(reading.text, reading.unit)
  const line = buildMeter({
    cols,
    label,
    labelWidth: resolveLabelWidth([label], labelWidth),
    style: style ?? 'htop',
    valueText: hideValue ? '' : valueText,
    percent: reading.percent,
    labelColor: labelColor.toRgbaCss(),
    valueColor: valueColor.toRgbaCss(),
    bracketColor: bracketColor.toRgbaCss(),
    emptyColor: emptyColor.toRgbaCss(),
    cellColor
  })

  return (
    <Screen font={font} cols={cols} rows={1}>
      <Lines font={font} lines={[line]} />
    </Screen>
  )
}

export default Meter
