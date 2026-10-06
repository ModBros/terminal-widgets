import React, { FunctionComponent } from 'react'
import {
  MissingConfigPlaceholder,
  Repeater,
  useCheckboxField,
  useColorField,
  useNumberField,
  useRepeaterField,
  useSelectField
} from '@modbros/dashboard-sdk'
import styled from 'styled-components'
import { Lines, Screen } from '../../components/Screen'
import {
  fitRows,
  useTerminalFont,
  useTerminalGrid
} from '../../utils/useTerminalFont'
import { useLevelColors } from '../../utils/colors'
import {
  buildMeter,
  minTopValueWidth,
  resolveLabelWidth
} from '../../utils/meter'
import {
  ItemReading,
  ReadingCollector,
  ReadingsProvider,
  useReadings
} from '../../utils/readings'
import { clamp, Line, LineBuilder, repeat } from '../../utils/text'
import { useThemeColors } from '../../utils/theme'

const Hidden = styled.div`
  display: none;
`

function getValueText(reading: ItemReading | undefined, hideValue: boolean) {
  if (hideValue) {
    return ''
  }

  return reading?.ready ? reading.text : '--'
}

const MeterGridContent: FunctionComponent = () => {
  const font = useTerminalFont()
  const theme = useThemeColors()
  const grid = useTerminalGrid(font)
  const items = useRepeaterField({ field: 'metrics' })
  const readings = useReadings()
  const columnsValue = useNumberField({ field: 'columns', defaultValue: 2 })
  const columnGap = useNumberField({ field: 'column_gap', defaultValue: 2 })
  const labelMode = useSelectField({
    field: 'label_mode',
    defaultValue: 'index'
  })
  const indexOffset = useNumberField({ field: 'index_offset', defaultValue: 0 })
  const hideLabel = useCheckboxField({ field: 'hide_label' })
  const labelWidthValue = useNumberField({ field: 'label_width' })
  const style = useSelectField({ field: 'style', defaultValue: 'htop' })
  const hideValue = useCheckboxField({ field: 'hide_value' })
  const hideUnit = useCheckboxField({ field: 'hide_unit' })
  const precision = useNumberField({ field: 'precision' })
  const min = useNumberField({ field: 'min' })
  const max = useNumberField({ field: 'max' })
  const labelColor = useColorField({
    field: 'text_color',
    defaultColor: theme.text
  }).toRgbaCss()
  const valueColor = useColorField({
    field: 'value_color',
    defaultColor: theme.text
  }).toRgbaCss()
  const bracketColor = useColorField({
    field: 'bracket_color',
    defaultColor: theme.bracket
  }).toRgbaCss()
  const emptyColor = useColorField({
    field: 'empty_color',
    defaultColor: theme.dim
  }).toRgbaCss()
  const { cellColor } = useLevelColors()

  const count = items.length

  if (count === 0) {
    return <MissingConfigPlaceholder text={'Please add at least one metric'} />
  }

  const columns = clamp(Math.floor(columnsValue ?? 1), 1, count)
  const gap = Math.max(0, Math.floor(columnGap ?? 0))
  const rowCount = Math.ceil(count / columns)
  const cols = fitRows(grid, rowCount)
  const cellCols = Math.max(
    1,
    Math.floor((cols - gap * (columns - 1)) / columns)
  )

  const labels = items.map((_item, index) => {
    if (hideLabel) {
      return ''
    }

    if (labelMode === 'name') {
      return readings[index]?.label ?? ''
    }

    return String(index + (indexOffset ?? 0))
  })
  const labelWidth = resolveLabelWidth(labels, labelWidthValue)
  const valueTexts = items.map((_item, index) =>
    getValueText(readings[index], hideValue)
  )
  // the top style puts the values in front of the bars, so they share a width
  const valueWidth = hideValue
    ? 0
    : Math.max(minTopValueWidth, ...valueTexts.map((text) => text.length))

  // fill column by column like the htop CPU meters
  const lines: Line[] = []

  for (let row = 0; row < rowCount; row++) {
    const line = new LineBuilder()

    for (let column = 0; column < columns; column++) {
      const index = column * rowCount + row

      if (column > 0) {
        line.append(repeat(' ', gap))
      }

      if (index >= count) {
        line.append(repeat(' ', cellCols))
        continue
      }

      const reading = readings[index]

      line.appendLine(
        buildMeter({
          cols: cellCols,
          label: labels[index],
          labelWidth,
          style: style ?? 'htop',
          valueText: valueTexts[index],
          valueWidth,
          percent: reading?.percent ?? 0,
          labelColor,
          valueColor,
          bracketColor,
          emptyColor,
          cellColor
        })
      )
    }

    lines.push(line.build())
  }

  return (
    <>
      <Hidden>
        <Repeater field={'metrics'}>
          {(_item, index) => (
            <ReadingCollector
              key={index}
              index={index}
              precision={precision}
              min={min}
              max={max}
              hideUnit={hideUnit}
            />
          )}
        </Repeater>
      </Hidden>

      <Screen font={font} cols={cols} rows={rowCount}>
        <Lines font={font} lines={lines} />
      </Screen>
    </>
  )
}

const MeterGrid: FunctionComponent = () => {
  return (
    <ReadingsProvider>
      <MeterGridContent />
    </ReadingsProvider>
  )
}

export default MeterGrid
