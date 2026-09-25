import React, { FunctionComponent, useCallback } from 'react'
import {
  useActionField,
  useCheckboxField,
  useColorField,
  useNumberField,
  useStringField
} from '@modbros/dashboard-sdk'
import styled from 'styled-components'
import { Row, Screen, SegmentView } from '../../components/Screen'
import {
  TerminalFont,
  useTerminalFont,
  useTerminalGrid
} from '../../utils/useTerminalFont'
import { clamp, padEnd, SegmentStyle } from '../../utils/text'
import { useThemeColors } from '../../utils/theme'

// action fields are not allowed inside repeaters, so keys are fixed slots
// named key_<slot>_key, key_<slot>_label and key_<slot>_action
const maxKeys = 10
const defaultLabels = [
  'Help',
  'Setup',
  'Search',
  'Filter',
  'Tree',
  'SortBy',
  'Nice -',
  'Nice +',
  'Kill',
  'Quit'
]

const Bar = styled(Row)`
  display: flex;
`

const Key = styled.span`
  cursor: pointer;

  &:active {
    filter: brightness(1.5);
  }
`

const Fill = styled.span`
  flex: 1;
`

interface KeySlotProps {
  slot: number
  font: TerminalFont
  labelWidth: number
  keyStyle: SegmentStyle
  labelStyle: SegmentStyle
}

const KeySlot = (props: KeySlotProps) => {
  const { slot, font, labelWidth, keyStyle, labelStyle } = props
  const key =
    useStringField({ field: `key_${slot}_key`, defaultValue: `F${slot}` }) ?? ''
  const label =
    useStringField({
      field: `key_${slot}_label`,
      defaultValue: defaultLabels[slot - 1]
    }) ?? ''
  const action = useActionField({ field: `key_${slot}_action` })

  const onClick = useCallback(() => {
    action()?.catch(() => undefined)
  }, [action])

  return (
    <Key onClick={onClick}>
      <SegmentView font={font} segment={{ ...keyStyle, text: key }} />
      <SegmentView
        font={font}
        segment={{
          ...labelStyle,
          text: padEnd(label, Math.max(labelWidth, label.length))
        }}
      />
    </Key>
  )
}

const KeyBar: FunctionComponent = () => {
  const font = useTerminalFont()
  const theme = useThemeColors()
  const { cols } = useTerminalGrid(font)
  const keyCount = useNumberField({ field: 'key_count', defaultValue: maxKeys })
  const labelWidth = useNumberField({ field: 'label_width', defaultValue: 6 })
  const hideFill = useCheckboxField({ field: 'hide_fill' })
  const keyColor = useColorField({
    field: 'key_color',
    defaultColor: theme.title
  })
  const keyBackgroundColor = useColorField({ field: 'key_background_color' })
  const labelColor = useColorField({
    field: 'label_color',
    defaultColor: theme.highlightText
  })
  const labelBackgroundColor = useColorField({
    field: 'label_background_color',
    defaultColor: theme.highlightBackground
  })

  const count = clamp(Math.floor(keyCount ?? maxKeys), 0, maxKeys)
  const keyStyle: SegmentStyle = {
    color: keyColor.toRgbaCss(),
    background: keyBackgroundColor.isEmpty()
      ? undefined
      : keyBackgroundColor.toRgbaCss()
  }
  const labelStyle: SegmentStyle = {
    color: labelColor.toRgbaCss(),
    background: labelBackgroundColor.toRgbaCss()
  }

  return (
    <Screen font={font} cols={cols} rows={1}>
      <Bar style={{ height: font.lineHeight }}>
        {Array.from({ length: count }, (_value, index) => (
          <KeySlot
            key={index}
            slot={index + 1}
            font={font}
            labelWidth={Math.max(0, labelWidth ?? 0)}
            keyStyle={keyStyle}
            labelStyle={labelStyle}
          />
        ))}

        {!hideFill && (
          <Fill style={{ backgroundColor: labelStyle.background }} />
        )}
      </Bar>
    </Screen>
  )
}

export default KeyBar
