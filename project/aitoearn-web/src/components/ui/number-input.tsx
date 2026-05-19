/**
 * NumberInput - 数字输入框
 * 基于 react-number-format，解决原生 type="number" 的浏览器行为不一致问题
 */
'use client'

import type { NumericFormatProps } from 'react-number-format'
import * as React from 'react'
import { NumericFormat } from 'react-number-format'
import { cn } from '@/lib/utils'

// 基础样式，与 src/components/ui/input.tsx 保持一致
const inputBaseClass
  = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

interface NumberInputProps
  extends Omit<NumericFormatProps, 'value' | 'onValueChange' | 'customInput' | 'isAllowed'> {
  value?: number | null
  onValueChange?: (value: number | undefined) => void
  /** 最小值：聚焦编辑时允许中间态，失焦后低于最小值会自动校正 */
  min?: number
  /** 最大值：聚焦编辑时允许中间态，失焦后高于最大值会自动校正 */
  max?: number
  className?: string
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onValueChange, min, max, allowNegative, onBlur, onFocus, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [draftValue, setDraftValue] = React.useState<string>(value == null ? '' : String(value))
    const draftNumberRef = React.useRef<number | undefined>(value ?? undefined)

    React.useEffect(() => {
      if (!isFocused) {
        draftNumberRef.current = value ?? undefined
        setDraftValue(value == null ? '' : String(value))
      }
    }, [isFocused, value])

    const resolveBlurValue = () => {
      const draftNumber = draftNumberRef.current
      if (draftNumber === undefined) {
        if (min !== undefined)
          return min
        return draftValue.trim() && allowNegative === false ? 0 : undefined
      }

      if (min !== undefined && draftNumber < min)
        return min
      if (max !== undefined && draftNumber > max)
        return max
      if (allowNegative === false && draftNumber < 0)
        return 0
      return draftNumber
    }

    return (
      <NumericFormat
        {...props}
        getInputRef={ref}
        className={cn(inputBaseClass, className)}
        value={isFocused ? draftValue : value ?? ''}
        allowNegative={isFocused ? true : allowNegative}
        onFocus={(event) => {
          setIsFocused(true)
          setDraftValue(value == null ? '' : String(value))
          draftNumberRef.current = value ?? undefined
          onFocus?.(event)
        }}
        onValueChange={(values) => {
          draftNumberRef.current = values.floatValue
          setDraftValue(values.formattedValue)
        }}
        onBlur={(event) => {
          const nextValue = resolveBlurValue()
          const currentValue = value ?? undefined
          draftNumberRef.current = nextValue
          setDraftValue(nextValue == null ? '' : String(nextValue))
          if (nextValue !== currentValue) {
            onValueChange?.(nextValue)
          }
          setIsFocused(false)
          onBlur?.(event)
        }}
      />
    )
  },
)
NumberInput.displayName = 'NumberInput'

export { NumberInput, type NumberInputProps }
