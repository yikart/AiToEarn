'use client'

import { useEffect, useState } from 'react'

/**
 * 自定义 Hook，用于获取多个 CSS 变量的值。
 * @param variableNames - CSS 变量名称数组（例如，['--main-color', '--secondary-color']）。
 * @param element - 获取 CSS 变量的元素（默认为 document.documentElement）。
 * @returns 一个对象，其中 CSS 变量名称作为键，变量值作为值。
 */
function useCssVariables(variableNames: string[] = [
  '--theColor1',
  '--theColor2',
  '--theColor3',
  '--theColor4',
  '--theColor5',
  '--theColor6',
  '--theColor7',
  '--theColor8',
  '--theColor9',
  '--colorPrimary1',
  '--colorPrimary2',
  '--colorPrimary3',
  '--colorPrimary4',
  '--colorPrimary5',
  '--colorPrimary6',
  '--colorPrimary7',
  '--colorPrimary8',
  '--colorPrimary9',
], element?: HTMLElement): Record<string, string> {
  const [variables, setVariables] = useState<Record<string, string>>({})

  if (typeof window === 'undefined')
    return variables

  element = element || document.documentElement

  useEffect(() => {
    const handleVariableChange = () => {
      const computedStyle = getComputedStyle(element)
      const newVariables = variableNames.reduce(
        (acc, name) => {
          acc[name] = computedStyle.getPropertyValue(name).trim()
          return acc
        },
        {} as Record<string, string>,
      )

      // 只有在变量值实际发生变化时才更新状态
      setVariables((prevVariables) => {
        const hasChanged = variableNames.some(
          name => prevVariables[name] !== newVariables[name],
        )
        return hasChanged ? newVariables : prevVariables
      })
    }

    // 初始获取
    handleVariableChange()

    // 可选：观察元素样式的变化
    const observer = new MutationObserver(handleVariableChange)
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [variableNames, element])

  return variables
}

export default useCssVariables
