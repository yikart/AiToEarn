import type { ForwardedRef } from 'react'
import { forwardRef, memo, useMemo } from 'react'

export interface IAllPlatIconRef {}

export interface IAllPlatIconProps {
  size?: number
  style?: React.CSSProperties
}

const AllPlatIcon = memo(
  forwardRef(
    (
      { size = 50, style = {} }: IAllPlatIconProps,
      ref: ForwardedRef<IAllPlatIconRef>,
    ) => {
      const widthChild = useMemo(() => {
        return size / 5
      }, [size])

      const childStyle = useMemo(() => {
        return {
          width: `${widthChild}px`,
          height: `${widthChild}px`,
        }
      }, [widthChild])

      return (
        <div
          className="flex flex-wrap gap-1"
          style={{ width: `${size}px`, height: `${size}px`, ...style }}
        >
          <ul className="flex gap-1 list-none p-0 m-0">
            <li className="bg-muted rounded" style={childStyle}></li>
            <li className="bg-muted rounded" style={childStyle}></li>
          </ul>
          <ul className="flex gap-1 list-none p-0 m-0">
            <li className="bg-muted rounded" style={childStyle}></li>
            <li className="bg-muted rounded" style={childStyle}></li>
          </ul>
        </div>
      )
    },
  ),
)

export default AllPlatIcon
