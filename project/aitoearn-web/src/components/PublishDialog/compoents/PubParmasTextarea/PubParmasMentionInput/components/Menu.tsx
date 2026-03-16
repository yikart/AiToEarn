/**
 * Menu - BeautifulMentionsPlugin 菜单组件
 */
import type {
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
} from 'lexical-beautiful-mentions'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Menu component for the BeautifulMentionsPlugin.
 */
export function Menu({ loading, ...other }: BeautifulMentionsMenuProps) {
  if (loading) {
    return (
      <div className="absolute top-0.5 left-0 z-[1000] bg-popover text-popover-foreground min-w-32 border border-border rounded-md shadow-lg p-3 flex items-center gap-2.5">
        <span className="block text-sm">Loading</span>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }
  return (
    <ul
      className="absolute top-0.5 left-0 z-[1000] bg-popover text-popover-foreground min-w-32 border border-border rounded-md shadow-lg p-1 m-0 overflow-hidden whitespace-nowrap [&>li]:px-3 [&>li]:py-2 [&>li]:rounded [&>li]:cursor-pointer [&>li]:transition-colors [&>li:hover]:bg-accent [&>li[aria-selected='true']]:bg-accent"
      {...other}
    />
  )
}

/**
 * MenuItem component for the BeautifulMentionsPlugin.
 */
export const MenuItem = forwardRef<HTMLLIElement, BeautifulMentionsMenuItemProps>(
  ({ selected, item, itemValue, ...props }, ref) => (
    <li
      ref={ref}
      {...props}
      className={cn(
        'relative flex items-center cursor-pointer rounded px-2 py-1.5 text-sm select-none outline-none',
        selected && 'bg-accent text-accent-foreground',
      )}
    />
  ),
)
MenuItem.displayName = 'MenuItem'
