import React, { FunctionComponent } from 'react'
import {
  useColorField,
  useSelectField,
  useStringField
} from '@modbros/dashboard-sdk'
import { Lines, Screen } from '../../components/Screen'
import { useTerminalFont, useTerminalGrid } from '../../utils/useTerminalFont'
import { Line, LineBuilder, repeat, truncate } from '../../utils/text'
import { defaultBoxColor, defaultTitleColor } from '../../utils/constants'

interface BorderChars {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
  horizontal: string
  vertical: string
  titleOpen: string
  titleClose: string
}

const borders: Record<string, BorderChars> = {
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    titleOpen: '┤',
    titleClose: '├'
  },
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    titleOpen: '┤',
    titleClose: '├'
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    titleOpen: '╡',
    titleClose: '╞'
  },
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
    titleOpen: '┫',
    titleClose: '┣'
  },
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    titleOpen: '[',
    titleClose: ']'
  }
}

// a title takes its text plus three border cells: "─┤ cpu ├"
function fitTitle(title: string | null, space: number): string {
  if (!title) {
    return ''
  }

  const text = truncate(` ${title} `, space - 3)

  return text.trim() ? text : ''
}

const Panel: FunctionComponent = () => {
  const font = useTerminalFont()
  const { cols, rows } = useTerminalGrid(font)
  const title = useStringField({ field: 'title' })
  const titleRight = useStringField({ field: 'title_right' })
  const borderStyle = useSelectField({
    field: 'border_style',
    defaultValue: 'rounded'
  })
  const borderColor = useColorField({
    field: 'border_color',
    defaultColor: defaultBoxColor
  })
  const titleColor = useColorField({
    field: 'title_color',
    defaultColor: defaultTitleColor
  })

  const chars = borders[borderStyle ?? 'rounded'] ?? borders.rounded
  const box = { color: borderColor.toRgbaCss() }
  const titleStyle = { color: titleColor.toRgbaCss() }
  const inner = Math.max(0, cols - 2)

  const left = fitTitle(title, inner)
  const leftLength = left ? left.length + 3 : 0
  const right = fitTitle(titleRight, inner - leftLength - 1)
  const rightLength = right ? right.length + 3 : 0

  const top = new LineBuilder().append(chars.topLeft, box)

  if (left) {
    top
      .append(chars.horizontal + chars.titleOpen, box)
      .append(left, titleStyle)
      .append(chars.titleClose, box)
  }

  top.append(repeat(chars.horizontal, inner - leftLength - rightLength), box)

  if (right) {
    top
      .append(chars.titleOpen, box)
      .append(right, titleStyle)
      .append(chars.titleClose + chars.horizontal, box)
  }

  const lines: Line[] = [top.append(chars.topRight, box).build()]

  if (rows > 1) {
    const middle = new LineBuilder()
      .append(chars.vertical, box)
      .append(repeat(' ', inner))
      .append(chars.vertical, box)
      .build()

    for (let row = 0; row < rows - 2; row++) {
      lines.push(middle)
    }

    lines.push(
      new LineBuilder()
        .append(chars.bottomLeft, box)
        .append(repeat(chars.horizontal, inner), box)
        .append(chars.bottomRight, box)
        .build()
    )
  }

  return (
    <Screen font={font} cols={cols} rows={lines.length} fill>
      <Lines font={font} lines={lines} />
    </Screen>
  )
}

export default Panel
