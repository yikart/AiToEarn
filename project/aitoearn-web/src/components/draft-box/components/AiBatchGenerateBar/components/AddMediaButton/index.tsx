/**
 * AddMediaButton - 添加本地媒体按钮
 */

'use client'

import { memo, useCallback, useRef } from 'react'

interface AddMediaButtonProps {
  onLocalUpload: (files: FileList) => void
  accept: string
  children: React.ReactNode
}

const AddMediaButton = memo(({
  onLocalUpload,
  accept,
  children,
}: AddMediaButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onLocalUpload(files)
    }
    e.target.value = ''
  }, [onLocalUpload])

  return (
    <div>
      <div onClick={handleTriggerClick}>
        {children}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
})

AddMediaButton.displayName = 'AddMediaButton'

export default AddMediaButton
