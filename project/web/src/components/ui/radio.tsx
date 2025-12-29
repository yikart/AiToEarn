/**
 * Radio - 单选组件
 * 用于单选选择
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 值 */
  value?: string | number
  /** 是否选中 */
  checked?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 子元素 */
  children?: React.ReactNode
}

const RadioComponent = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, value, checked, disabled, children, ...props }, ref) => {
    return (
      <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
        <input
          type="radio"
          ref={ref}
          value={value}
          checked={checked}
          disabled={disabled}
          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
          {...props}
        />
        {children && <span>{children}</span>}
      </label>
    )
  },
)
RadioComponent.displayName = 'Radio'

interface RadioGroupProps {
  /** 选中的值 */
  value?: string | number
  /** 值改变回调 */
  onChange?: (e: { target: { value: string | number } }) => void
  /** 子元素 */
  children?: React.ReactNode
  /** 自定义类名 */
  className?: string
}

function RadioGroup({ value, onChange, children, className }: RadioGroupProps) {
  const handleChange = (newValue: string | number) => {
    onChange?.({ target: { value: newValue } })
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<RadioProps>(child) && child.type === RadioComponent) {
          return React.cloneElement(child, {
            checked: child.props.value === value,
            onChange: () => handleChange(child.props.value as string | number),
          })
        }
        return child
      })}
    </div>
  )
}

// 创建带 Group 的 Radio 组件
const Radio = Object.assign(RadioComponent, {
  Group: RadioGroup,
})

export { Radio, RadioGroup }
