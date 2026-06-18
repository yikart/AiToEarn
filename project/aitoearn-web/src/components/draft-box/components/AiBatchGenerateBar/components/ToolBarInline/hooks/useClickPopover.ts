import { useCallback, useState } from 'react'

export function useClickPopover() {
  const [open, setOpen] = useState(false)
  const onOpenChange = useCallback((value: boolean) => setOpen(value), [])
  return { open, onOpenChange }
}
