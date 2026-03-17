/**
 * PublishUploadProgress - 上传进度显示组件
 * 显示文件上传的圆形进度条
 */
import { Check, X } from 'lucide-react'
import { forwardRef, memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { UploadTaskStatusEnum } from './publishManageUpload.enum'

export type IPublishUploadProgressRef = HTMLDivElement

export interface IPublishUploadProgressProps {
  taskId: string
}

const PublishUploadProgress = memo(
  forwardRef<IPublishUploadProgressRef, IPublishUploadProgressProps>(({ taskId }, ref) => {
    const task = usePublishManageUpload(state => state.tasks[taskId])
    const { t } = useTransClient('publish')

    const { percent, tooltipTitle, progressStatus, showIcon, isSuccess } = useMemo(() => {
      const defaultResult = {
        percent: 0,
        tooltipTitle: '',
        progressStatus: 'normal' as 'normal' | 'success' | 'exception',
        showIcon: false,
        isSuccess: false,
      }

      if (!task) {
        return defaultResult
      }

      const clampPercent = (value: number) => {
        if (Number.isNaN(value))
          return 0
        return Math.min(100, Math.max(0, value))
      }

      let computedPercent = clampPercent(task.progress ?? 0)
      let status: 'normal' | 'success' | 'exception' = 'normal'
      let showIcon = false
      let isSuccess = false

      const ensureMinimum = () => {
        if (computedPercent <= 0) {
          computedPercent = 5
        }
      }

      switch (task.status) {
        case UploadTaskStatusEnum.Hashing:
        case UploadTaskStatusEnum.Pending:
        case UploadTaskStatusEnum.Uploading:
          ensureMinimum()
          break
        case UploadTaskStatusEnum.Success:
          computedPercent = 100
          status = 'success'
          showIcon = true
          isSuccess = true
          break
        case UploadTaskStatusEnum.Error:
          status = 'exception'
          showIcon = true
          break
        case UploadTaskStatusEnum.Canceled:
          status = 'exception'
          break
        default:
          break
      }

      if (task.fromCache) {
        computedPercent = 100
        status = 'success'
        showIcon = true
        isSuccess = true
      }

      const displayPercent = Math.round(clampPercent(computedPercent))
      let tooltipTitle: string = t('upload.progress', {
        percent: displayPercent,
      })

      if (task.status === UploadTaskStatusEnum.Success || task.fromCache) {
        tooltipTitle = t('upload.completed')
      }
      else if (task.status === UploadTaskStatusEnum.Error) {
        tooltipTitle = t('upload.failed')
      }
      else if (task.status === UploadTaskStatusEnum.Canceled) {
        tooltipTitle = t('upload.canceled')
      }

      return {
        percent: computedPercent,
        tooltipTitle,
        progressStatus: status,
        showIcon,
        isSuccess,
      }
    }, [task, t])

    if (!task) {
      return null
    }

    // 计算进度环的参数
    const size = 28
    const strokeWidth = 3
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference

    // 根据状态确定进度条颜色
    const getProgressColor = () => {
      if (progressStatus === 'exception')
        return '#ef4444'
      if (progressStatus === 'success')
        return '#22c55e'
      return '#3b82f6' // 蓝色
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              className={cn(
                'absolute left-1.5 bottom-1.5 z-10',
                'flex items-center justify-center',
                'cursor-pointer',
              )}
            >
              <div
                className="relative flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm"
                style={{ width: size, height: size }}
              >
                <svg width={size} height={size} className="absolute rotate-[-90deg]">
                  {/* 背景圆环 - 灰色轨道 */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth={strokeWidth}
                  />
                  {/* 进度圆环 - 彩色进度 */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getProgressColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>

                {/* 中心内容 */}
                <div className="relative z-10 flex items-center justify-center text-white">
                  {showIcon ? (
                    isSuccess ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-400" />
                    )
                  ) : (
                    <span className="text-[9px] font-semibold">{Math.round(percent)}</span>
                  )}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            {tooltipTitle}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }),
)

export default PublishUploadProgress
