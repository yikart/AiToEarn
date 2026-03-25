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
  /** 最小值，设置后输入框不允许清空或低于此值 */
  min?: number
  className?: string
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onValueChange, min, ...props }, ref) => {
    return (
      <NumericFormat
        getInputRef={ref}
        className={cn(inputBaseClass, className)}
        value={value ?? ''}
        onValueChange={(values) => {
          onValueChange?.(values.floatValue)
        }}
        isAllowed={min !== undefined
          ? ({ floatValue }) => floatValue !== undefined && floatValue >= min
          : undefined}
        {...props}
      />
    )
  },
)
NumberInput.displayName = 'NumberInput'

export { NumberInput, type NumberInputProps }
