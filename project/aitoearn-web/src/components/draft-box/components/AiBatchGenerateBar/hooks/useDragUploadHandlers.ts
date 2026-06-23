import { useCallback, useRef, useState } from 'react'

export function useDragUploadHandlers(handleLocalUpload: (files: FileList) => void) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCountRef = useRef(0)

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragCountRef.current++
    if (dragCountRef.current === 1)
      setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragCountRef.current--
    if (dragCountRef.current === 0)
      setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      dragCountRef.current = 0
      setIsDragging(false)
      const files = event.dataTransfer.files
      if (files.length > 0)
        handleLocalUpload(files)
    },
    [handleLocalUpload],
  )

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(event.clipboardData.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => Boolean(file))

      if (files.length === 0)
        return

      event.preventDefault()
      const dataTransfer = new DataTransfer()
      files.forEach(file => dataTransfer.items.add(file))
      void handleLocalUpload(dataTransfer.files)
    },
    [handleLocalUpload],
  )

  return {
    isDragging,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
  }
}
