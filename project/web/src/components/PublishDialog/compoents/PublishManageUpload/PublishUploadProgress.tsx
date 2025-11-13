import type { ReactNode } from 'react'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Progress, Tooltip } from 'antd'
import { forwardRef, memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import { UploadTaskStatusEnum } from './publishManageUpload.enum'
import styles from './publishUploadProgress.module.scss'

export type IPublishUploadProgressRef = HTMLDivElement

export interface IPublishUploadProgressProps {
  taskId: string
}

const PublishUploadProgress = memo(
  forwardRef<IPublishUploadProgressRef, IPublishUploadProgressProps>(
    ({ taskId }, ref) => {
      const task = usePublishManageUpload(state => state.tasks[taskId])
      const { t } = useTransClient('publish')

      const {
        percent,
        tooltipTitle,
        progressStatus,
        format,
        strokeColor,
        showText,
      } = useMemo(() => {
        const defaultResult = {
          percent: 0,
          tooltipTitle: '',
          progressStatus: 'normal' as 'normal' | 'success' | 'exception',
          format: undefined as ((percent?: number) => ReactNode) | undefined,
          strokeColor: 'var(--theColor5)',
          showText: false,
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
        let format: ((percent?: number) => ReactNode) | undefined
        let strokeColor = 'var(--theColor5)'
        let showText = false

        const ensureMinimum = () => {
          if (computedPercent <= 0) {
            computedPercent = 8
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
            format = () => <CheckOutlined style={{ fontSize: 12 }} />
            strokeColor = 'var(--theColor5)'
            showText = true
            break
          case UploadTaskStatusEnum.Error:
            status = 'exception'
            format = () => <CloseOutlined style={{ fontSize: 12 }} />
            strokeColor = 'var(--theColor8)'
            showText = true
            break
          case UploadTaskStatusEnum.Canceled:
            status = 'exception'
            strokeColor = 'var(--theColor8)'
            break
          default:
            break
        }

        if (task.fromCache) {
          computedPercent = 100
          status = 'success'
          format = () => <CheckOutlined style={{ fontSize: 12 }} />
          strokeColor = 'var(--theColor5)'
          showText = true
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
          format,
          strokeColor,
          showText,
        }
      }, [task])

      if (!task) {
        return null
      }

      return (
        <Tooltip title={tooltipTitle} placement="topLeft">
          <div ref={ref} className={styles.publishUploadProgress}>
            <div className={styles.publishUploadProgress_circle}>
              <Progress
                type="circle"
                percent={percent}
                size={25}
                strokeWidth={7}
                status={progressStatus}
                strokeColor={strokeColor}
                trailColor="rgba(255, 255, 255, 0.15)"
                format={showText ? format : undefined}
              />
            </div>
          </div>
        </Tooltip>
      )
    },
  ),
)

export default PublishUploadProgress
