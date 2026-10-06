import { ChannelValue } from '@modbros/dashboard-core'
import {
  useFormatMetricValue,
  useMemoizedMetricField
} from '@modbros/dashboard-sdk'
import { clamp } from './text'

export interface MetricReading {
  channelValue: ChannelValue | null
  ready: boolean
  name: string
  value: number | null
  text: string
  unit: string
  range: MetricRange
  percent: number
}

export function parseNumber(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null
  }

  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export interface MetricRange {
  min: number
  max: number
  // false if the max follows the metric and may grow with new values
  fixedMax: boolean
}

// units with a natural upper bound, everything else uses the highest value
const unitMaxValues: Record<string, number> = {
  '%': 100,
  '°C': 100
}

export function getRange(
  channelValue: ChannelValue | null,
  value: number | null,
  minOverride: number | null,
  maxOverride: number | null
): MetricRange {
  const min = minOverride ?? 0

  if (typeof maxOverride === 'number' && maxOverride > min) {
    return { min, max: maxOverride, fixedMax: true }
  }

  const unitMax = unitMaxValues[channelValue?.unit?.abbreviation ?? '']
  const statisticsMax = parseNumber(channelValue?.value?.statistics?.max)
  const max = Math.max(unitMax ?? statisticsMax ?? 0, value ?? 0)

  return { min, max, fixedMax: false }
}

export function getPercent(value: number | null, range: MetricRange): number {
  if (value === null || range.max <= range.min) {
    return 0
  }

  return clamp((value - range.min) / (range.max - range.min), 0, 1)
}

function toText(node: unknown): string {
  if (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  ) {
    return String(node)
  }

  return ''
}

export function joinValue(text: string, unit: string): string {
  if (!text || !unit) {
    return text
  }

  if (unit === '%' || unit.startsWith('°')) {
    return `${text}${unit}`
  }

  return `${text} ${unit}`
}

// everything a reading is derived from, so the widget only re-renders when
// the displayed text, label or bar length can change
function displayedParts(channelValue: ChannelValue | null) {
  if (!channelValue?.value) {
    return null
  }

  return {
    metric: channelValue.metric?.id,
    label: channelValue.metric?.label,
    unit: channelValue.unit?.abbreviation,
    value: channelValue.value.value,
    max: channelValue.value.statistics?.max
  }
}

function metricValueOf(channelValue: ChannelValue | null) {
  return channelValue?.value ?? null
}

function isSameObject<T>(a: T | null, b: T | null): boolean {
  return a === b
}

export function useMetricReading(props: {
  field: string
  precision: number | null
  min: number | null
  max: number | null
  // re-render on every update, even if the value did not change
  everyUpdate?: boolean
}): MetricReading {
  const { field, precision, min, max, everyUpdate } = props
  const { channelValue } = useMemoizedMetricField<unknown>(
    everyUpdate
      ? { field, memo: metricValueOf, equals: isSameObject }
      : { field, memo: displayedParts }
  )
  const format = useFormatMetricValue()

  const value = parseNumber(channelValue?.value?.value)
  const range = getRange(channelValue, value, min, max)
  let text = ''
  let unit = ''

  if (channelValue?.value) {
    const hasPrecision = typeof precision === 'number'
    const formatted = format(channelValue, {
      precision: hasPrecision ? precision : undefined,
      valueBasedPrecision: !hasPrecision
    })

    text = toText(formatted?.value) || toText(channelValue.value.value)
    unit = formatted?.unit ?? ''
  }

  return {
    channelValue,
    ready: Boolean(channelValue?.value),
    name: channelValue?.metric?.label ?? '',
    value,
    text,
    unit,
    range,
    percent: getPercent(value, range)
  }
}
