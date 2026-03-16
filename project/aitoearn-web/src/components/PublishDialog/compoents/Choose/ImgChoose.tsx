/**
 * ImgChoose - 图片选择组件
 * 用于选择本地图片文件
 */

import type { FC } from 'react'
import type { IImgFile } from '@/components/PublishDialog/publishDialog.type'
import { useCallback, useRef } from 'react'
import { formatImg } from '@/components/PublishDialog/PublishDialog.util'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

interface ImgChooseProps {
  // 单选就使用单选方法，多选就使用单选方法

  // 单选返回
  onChoose?: (_: IImgFile) => void
  // 多选返回方法
  onMultipleChoose?: (_: IImgFile[]) => void
  children?: React.ReactNode
}

const ImgChoose: FC<ImgChooseProps> = ({ onChoose, onMultipleChoose, children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 处理文件选择
   */
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0)
        return

      try {
        const tasks: Promise<IImgFile>[] = []
        for (const file of Array.from(files)) {
          tasks.push(
            formatImg({
              path: file.name,
              blob: file,
            }),
          )
        }
        const imgFiles = await Promise.all(tasks)
        if (onMultipleChoose) {
          onMultipleChoose(imgFiles)
        }
        else if (onChoose) {
          onChoose(imgFiles[0])
        }
      }
      catch (e) {
        toast.error('选择图片失败')
        console.error(e)
      }
      finally {
        // 清空 input 以便下次选择同一文件
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [onChoose, onMultipleChoose],
  )

  /**
   * 触发文件选择
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={!!onMultipleChoose}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {children ? (
        <div className="imgChoose cursor-pointer" onClick={triggerFileInput}>
          {children}
        </div>
      ) : (
        <Button className="cursor-pointer" onClick={triggerFileInput}>
          选择图片
        </Button>
      )}
    </>
  )
}

export default ImgChoose
