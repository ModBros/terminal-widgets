import { ChannelValue } from '@modbros/dashboard-core'
import {
  useFormatMetricValue,
  useMemoizedMetricField
} from '@modbros/dashboard-sdk'

export interface MetricReading {
  channelValue: ChannelValue | null
  ready: boolean
  name: string
  value: number | null
  text: string
  unit: string
  max: number
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

export function getMaxValue(
  channelValue: ChannelValue | null,
  value: number | null,
  maxOverride: number | null
): number {
  if (typeof maxOverride === 'number' && maxOverride > 0) {
    return maxOverride
  }

  if (channelValue?.unit?.abbreviation === '%') {
    return Math.max(100, value ?? 0)
  }

  const statisticsMax = parseNumber(channelValue?.value?.statistics?.max)

  return Math.max(statisticsMax ?? 0, value ?? 0)
}

export function getPercent(value: number | null, max: number): number {
  if (value === null || max <= 0) {
    return 0
  }

  return Math.min(1, Math.max(0, value / max))
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
  max: number | null
  // re-render on every update, even if the value did not change
  everyUpdate?: boolean
}): MetricReading {
  const { field, precision, max: maxOverride, everyUpdate } = props
  const { channelValue } = useMemoizedMetricField<unknown>(
    everyUpdate
      ? { field, memo: metricValueOf, equals: isSameObject }
      : { field, memo: displayedParts }
  )
  const format = useFormatMetricValue()

  const value = parseNumber(channelValue?.value?.value)
  const max = getMaxValue(channelValue, value, maxOverride)
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
    max,
    percent: getPercent(value, max)
  }
}
