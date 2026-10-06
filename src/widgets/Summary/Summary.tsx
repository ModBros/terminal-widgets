import React, { FunctionComponent } from 'react'
import {
  MissingConfigPlaceholder,
  Repeater,
  useCheckboxField,
  useColorField,
  useNumberField,
  useRepeaterField,
  useSelectField,
  useStringField
} from '@modbros/dashboard-sdk'
import styled from 'styled-components'
import { Lines, Screen } from '../../components/Screen'
import { useTerminalFont, useTerminalGrid } from '../../utils/useTerminalFont'
import {
  ReadingCollector,
  ReadingsProvider,
  useReadings
} from '../../utils/readings'
import { LineBuilder, padEnd, padStart } from '../../utils/text'
import { useThemeColors } from '../../utils/theme'

const Hidden = styled.div`
  display: none;
`

/**
 * %Cpu(s):  5.9 us,  2.0 sy, 91.8 id
 */
const SummaryContent: FunctionComponent = () => {
  const font = useTerminalFont()
  const theme = useThemeColors()
  const { cols } = useTerminalGrid(font)
  const items = useRepeaterField({ field: 'items' })
  const readings = useReadings()
  const title = useStringField({ field: 'title' })
  const titleWidth = useNumberField({ field: 'title_width' })
  const labelPosition = useSelectField({
    field: 'label_position',
    defaultValue: 'after'
  })
  const separator = useStringField({ field: 'separator', defaultValue: ', ' })
  const valueWidth = useNumberField({ field: 'value_width' })
  const boldValues = useCheckboxField({ field: 'bold_values' })
  const hideUnit = useCheckboxField({ field: 'hide_unit' })
  const precision = useNumberField({ field: 'precision' })
  const titleColor = useColorField({
    field: 'title_color',
    defaultColor: theme.title
  }).toRgbaCss()
  const labelColor = useColorField({
    field: 'text_color',
    defaultColor: theme.text
  }).toRgbaCss()
  const valueColor = useColorField({
    field: 'value_color',
    defaultColor: theme.value
  }).toRgbaCss()

  if (items.length === 0) {
    return <MissingConfigPlaceholder text={'Please add at least one value'} />
  }

  const labelStyle = { color: labelColor }
  const valueStyle = { color: valueColor, bold: boldValues }
  const minValueWidth = Math.max(0, Math.floor(valueWidth ?? 0))
  const line = new LineBuilder()
  const titleText = title ?? ''

  if (titleText) {
    const width = Math.max(titleText.length, Math.floor(titleWidth ?? 0))

    line.append(padEnd(titleText, width), { color: titleColor }).append(' ')
  }

  items.forEach((_item, index) => {
    const reading = readings[index]
    const text = reading?.ready ? reading.text : '--'
    const value = padStart(text, Math.max(minValueWidth, text.length))
    const label = labelPosition === 'none' ? '' : reading?.label ?? ''

    if (index > 0) {
      line.append(separator ?? '', labelStyle)
    }

    if (label && labelPosition === 'before') {
      line.append(`${label} `, labelStyle)
    }

    line.append(value, valueStyle)

    if (label && labelPosition !== 'before') {
      line.append(` ${label}`, labelStyle)
    }
  })

  // shrink the text instead of cutting it off when it does not fit
  const screenCols = Math.max(cols, line.length)

  return (
    <>
      <Hidden>
        <Repeater field={'items'}>
          {(_item, index) => (
            <ReadingCollector
              key={index}
              index={index}
              precision={precision}
              min={null}
              max={null}
              hideUnit={hideUnit}
            />
          )}
        </Repeater>
      </Hidden>

      <Screen font={font} cols={screenCols} rows={1}>
        <Lines font={font} lines={[line.padTo(screenCols).build()]} />
      </Screen>
    </>
  )
}

const Summary: FunctionComponent = () => {
  return (
    <ReadingsProvider>
      <SummaryContent />
    </ReadingsProvider>
  )
}

export default Summary
