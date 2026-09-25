import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo
} from 'react'
import {
  createStore,
  useStoreSelector,
  useStringField
} from '@modbros/dashboard-sdk'
import { isEqual } from 'lodash-es'
import { joinValue, useMetricReading } from './metric'

export interface ItemReading {
  label: string
  value: number | null
  text: string
  percent: number
  ready: boolean
}

type ReadingsState = Record<number, ItemReading>

const ReadingsContext = createContext(createStore<ReadingsState>({}))

/**
 * Repeater items can only read their own fields, so every item publishes its
 * reading here and the widget renders all of them as one text screen.
 */
export const ReadingsProvider = (props: PropsWithChildren) => {
  const { children } = props
  const store = useMemo(() => createStore<ReadingsState>({}), [])

  return (
    <ReadingsContext.Provider value={store}>
      {children}
    </ReadingsContext.Provider>
  )
}

export function useReadings(): ReadingsState {
  return useStoreSelector(ReadingsContext, (state) => state)
}

interface ReadingCollectorProps {
  index: number
  precision: number | null
  max: number | null
  hideUnit: boolean
}

// must be rendered inside a Repeater item with a "metric" and a "label" field
export const ReadingCollector = (props: ReadingCollectorProps) => {
  const { index, precision, max, hideUnit } = props
  const store = useContext(ReadingsContext)
  const customLabel = useStringField({ field: 'label' })
  const reading = useMetricReading({ field: 'metric', precision, max })

  const item: ItemReading = {
    label: customLabel || reading.name,
    value: reading.value,
    text: hideUnit ? reading.text : joinValue(reading.text, reading.unit),
    percent: reading.percent,
    ready: reading.ready
  }

  useEffect(() => {
    store.setState((prev) =>
      isEqual(prev[index], item) ? prev : { ...prev, [index]: item }
    )
  })

  useEffect(() => {
    return () => {
      store.setState((prev) => {
        const next = { ...prev }
        delete next[index]

        return next
      })
    }
  }, [store, index])

  return null
}
