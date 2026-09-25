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
import { useLevelColors } from '../../utils/colors'
import { buildMeter } from '../../utils/meter'
import {
  ItemReading,
  ReadingCollector,
  ReadingsProvider,
  useReadings
} from '../../utils/readings'
import {
  Line,
  LineBuilder,
  padEnd,
  padStart,
  repeat,
  withBackground
} from '../../utils/text'
import {
  defaultDimColor,
  defaultHeaderBackgroundColor,
  defaultHeaderTextColor,
  defaultHighlightBackgroundColor,
  defaultHighlightTextColor,
  defaultTextColor,
  defaultValueColor
} from '../../utils/constants'

const Hidden = styled.div`
  display: none;
`

interface Entry {
  index: number
  reading?: ItemReading
}

function compareEntries(a: Entry, b: Entry, direction: number): number {
  const valueA = a.reading?.value ?? null
  const valueB = b.reading?.value ?? null

  // rows without a numeric value always go last
  if (valueA === null || valueB === null) {
    return Number(valueA === null) - Number(valueB === null)
  }

  return (valueA - valueB) * direction || a.index - b.index
}

const TableContent: FunctionComponent = () => {
  const font = useTerminalFont()
  const { cols } = useTerminalGrid(font)
  const items = useRepeaterField({ field: 'rows' })
  const readings = useReadings()
  const headerName = useStringField({
    field: 'header_name',
    defaultValue: 'NAME'
  })
  const headerValue = useStringField({
    field: 'header_value',
    defaultValue: 'VALUE'
  })
  const hideHeader = useCheckboxField({ field: 'hide_header' })
  const sort = useSelectField({ field: 'sort', defaultValue: 'none' })
  const limit = useNumberField({ field: 'limit' })
  const highlightRow = useNumberField({ field: 'highlight_row' })
  const showBar = useCheckboxField({ field: 'show_bar' })
  const barWidthValue = useNumberField({ field: 'bar_width', defaultValue: 10 })
  const hideUnit = useCheckboxField({ field: 'hide_unit' })
  const precision = useNumberField({ field: 'precision' })
  const max = useNumberField({ field: 'max' })
  const textColor = useColorField({
    field: 'text_color',
    defaultColor: defaultTextColor
  }).toRgbaCss()
  const valueColor = useColorField({
    field: 'value_color',
    defaultColor: defaultValueColor
  }).toRgbaCss()
  const emptyColor = useColorField({
    field: 'empty_color',
    defaultColor: defaultDimColor
  }).toRgbaCss()
  const headerTextColor = useColorField({
    field: 'header_text_color',
    defaultColor: defaultHeaderTextColor
  }).toRgbaCss()
  const headerBackgroundColor = useColorField({
    field: 'header_background_color',
    defaultColor: defaultHeaderBackgroundColor
  }).toRgbaCss()
  const highlightTextColor = useColorField({
    field: 'highlight_text_color',
    defaultColor: defaultHighlightTextColor
  }).toRgbaCss()
  const highlightBackgroundColor = useColorField({
    field: 'highlight_background_color',
    defaultColor: defaultHighlightBackgroundColor
  }).toRgbaCss()
  const { cellColor } = useLevelColors()

  if (items.length === 0) {
    return <MissingConfigPlaceholder text={'Please add at least one row'} />
  }

  let entries: Entry[] = items.map((_item, index) => ({
    index,
    reading: readings[index]
  }))

  if (sort === 'asc' || sort === 'desc') {
    const direction = sort === 'asc' ? 1 : -1
    entries = [...entries].sort((a, b) => compareEntries(a, b, direction))
  }

  if (limit && limit > 0) {
    entries = entries.slice(0, limit)
  }

  const nameHeader = headerName ?? ''
  const valueHeader = headerValue ?? ''
  const values = entries.map(({ reading }) =>
    reading?.ready ? reading.text : '--'
  )
  const valueWidth = Math.max(
    hideHeader ? 0 : valueHeader.length,
    ...values.map((value) => value.length)
  )
  const barWidth = showBar ? Math.max(1, Math.floor(barWidthValue ?? 10)) : 0
  const barSpace = barWidth > 0 ? barWidth + 1 : 0
  const nameWidth = Math.max(0, cols - valueWidth - 1 - barSpace)
  const lines: Line[] = []

  if (!hideHeader) {
    const headerStyle = {
      color: headerTextColor,
      background: headerBackgroundColor
    }

    lines.push(
      new LineBuilder()
        .append(padEnd(nameHeader, nameWidth), headerStyle)
        .append(repeat(' ', barSpace), headerStyle)
        .append(` ${padStart(valueHeader, valueWidth)}`, headerStyle)
        .padTo(cols, headerStyle)
        .build()
    )
  }

  entries.forEach(({ reading }, position) => {
    const highlighted = highlightRow === position + 1
    const background = highlighted ? highlightBackgroundColor : undefined
    const nameStyle = {
      color: highlighted ? highlightTextColor : textColor,
      background
    }
    const line = new LineBuilder().append(
      padEnd(reading?.label ?? '', nameWidth),
      nameStyle
    )

    if (barWidth > 0) {
      line.append(' ', nameStyle)
      line.appendLine(
        withBackground(
          buildMeter({
            cols: barWidth,
            label: '',
            labelWidth: 0,
            style: 'btop',
            valueText: '',
            percent: reading?.percent ?? 0,
            labelColor: textColor,
            valueColor,
            bracketColor: textColor,
            emptyColor,
            cellColor
          }),
          background
        )
      )
    }

    line.append(` ${padStart(values[position], valueWidth)}`, {
      color: highlighted ? highlightTextColor : valueColor,
      background
    })

    lines.push(line.padTo(cols, nameStyle).build())
  })

  return (
    <>
      <Hidden>
        <Repeater field={'rows'}>
          {(_item, index) => (
            <ReadingCollector
              key={index}
              index={index}
              precision={precision}
              max={max}
              hideUnit={hideUnit}
            />
          )}
        </Repeater>
      </Hidden>

      <Screen font={font} cols={cols} rows={lines.length}>
        <Lines font={font} lines={lines} />
      </Screen>
    </>
  )
}

const Table: FunctionComponent = () => {
  return (
    <ReadingsProvider>
      <TableContent />
    </ReadingsProvider>
  )
}

export default Table
