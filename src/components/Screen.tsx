import React, { CSSProperties, memo, PropsWithChildren, ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import { isEqual } from 'lodash-es'
import { useColorField, useItemSize } from '@modbros/dashboard-sdk'
import { TerminalFont } from '../utils/useTerminalFont'
import { Line, Segment } from '../utils/text'

const blink = keyframes`
  50% {
    opacity: 0;
  }
`

const Viewport = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const Pre = styled.pre`
  position: absolute;
  left: 0;
  margin: 0;
  padding: 0;
  white-space: pre;
  transform-origin: 0 0;
  font-variant-ligatures: none;
`

export const Row = styled.div`
  overflow: visible;
`

// box drawing, block and braille glyphs are often served by a fallback font
// with a different advance width, so each of those gets a cell of its own
const Cell = styled.span`
  display: inline-block;
  vertical-align: top;
  text-align: center;
`

const Blink = styled.span`
  animation: ${blink} 1s steps(1, end) infinite;
`

function renderText(text: string, font: TerminalFont): ReactNode[] {
  const nodes: ReactNode[] = []
  const cellStyle: CSSProperties = {
    width: font.charWidth,
    height: font.lineHeight
  }
  let plain = ''

  for (const char of text) {
    if (char.charCodeAt(0) < 128 || font.fitsCell(char)) {
      plain += char
      continue
    }

    if (plain) {
      nodes.push(plain)
      plain = ''
    }

    nodes.push(
      <Cell key={nodes.length} style={cellStyle}>
        {char}
      </Cell>
    )
  }

  if (plain) {
    nodes.push(plain)
  }

  return nodes
}

interface SegmentViewProps {
  segment: Segment
  font: TerminalFont
}

export const SegmentView = (props: SegmentViewProps) => {
  const { segment, font } = props
  const style: CSSProperties = {
    color: segment.color,
    backgroundColor: segment.background,
    fontWeight: segment.bold ? 'bold' : undefined
  }
  const content = renderText(segment.text, font)

  if (segment.blink) {
    return <Blink style={style}>{content}</Blink>
  }

  return <span style={style}>{content}</span>
}

interface LineViewProps {
  line: Line
  font: TerminalFont
}

// lines are rebuilt on every render, so compare their content to skip the
// ones that did not change
const LineView = memo(
  (props: LineViewProps) => {
    const { line, font } = props

    return (
      <Row style={{ height: font.lineHeight }}>
        {line.map((segment, segmentIndex) => (
          <SegmentView key={segmentIndex} segment={segment} font={font} />
        ))}
      </Row>
    )
  },
  (prev, next) => prev.font === next.font && isEqual(prev.line, next.line)
)

interface LinesProps {
  lines: Line[]
  font: TerminalFont
}

export const Lines = (props: LinesProps) => {
  const { lines, font } = props

  return (
    <>
      {lines.map((line, lineIndex) => (
        <LineView key={lineIndex} line={line} font={font} />
      ))}
    </>
  )
}

interface ScreenProps {
  font: TerminalFont
  cols: number
  rows: number
  // stretch the rows to the full widget height instead of centering them
  fill?: boolean
}

/**
 * Renders a grid of `cols` x `rows` characters and scales it to the widget
 * size, so the text lines up exactly with the widget edges.
 */
export const Screen = (props: PropsWithChildren<ScreenProps>) => {
  const { font, cols, rows, fill, children } = props
  const { width, height } = useItemSize()
  const background = useColorField({ field: 'background_color' })

  const naturalWidth = Math.max(1, cols) * font.charWidth
  const naturalHeight = Math.max(1, rows) * font.lineHeight
  const scaleX = width > 0 ? width / naturalWidth : 1
  const fitY = height > 0 ? height / naturalHeight : 1
  const scaleY = fill ? fitY : Math.min(1, fitY)
  const top = fill ? 0 : Math.max(0, (height - naturalHeight * scaleY) / 2)

  return (
    <Viewport
      style={{
        backgroundColor: background.isEmpty()
          ? undefined
          : background.toRgbaCss()
      }}
    >
      <Pre
        style={{
          top,
          width: naturalWidth,
          fontFamily: font.fontFamily,
          fontSize: `${font.fontSize}px`,
          lineHeight: `${font.lineHeight}px`,
          transform: `scale(${scaleX}, ${scaleY})`
        }}
      >
        {children}
      </Pre>
    </Viewport>
  )
}
