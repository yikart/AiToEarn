/**
 * 发布任务列表弹框组件
 */

'use client'

import type { ColumnsType } from 'antd/es/table'
import type { PluginPlatformType, PublishTask } from '../types/baseTypes'
import { Modal, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { usePluginStore } from '../store'
import { PlatformTaskStatus } from '../types/baseTypes'
import styles from './PublishListModal.module.scss'

/**
 * 组件属性
 */
export interface PublishListModalProps {
  /** 是否显示 */
  visible: boolean

  /** 关闭回调 */
  onClose: () => void

  /** 点击查看详情回调 */
  onViewDetail?: (task: PublishTask) => void
}

/**
 * 获取状态对应的标签颜色
 */
function getStatusColor(status: PlatformTaskStatus): string {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'success'
    case PlatformTaskStatus.PUBLISHING:
      return 'processing'
    case PlatformTaskStatus.ERROR:
      return 'error'
    case PlatformTaskStatus.PENDING:
      return 'default'
    default:
      return 'default'
  }
}

/**
 * 获取平台显示名称
 * @param platform 平台类型（PlatType）
 * @returns 平台显示名称
 */
function getPlatformName(platform: PluginPlatformType): string {
  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.name || platform
}

/**
 * 发布任务列表弹框组件
 */
export function PublishListModal({ visible, onClose, onViewDetail }: PublishListModalProps) {
  const { t } = useTranslation('plugin')
  const publishTasks = usePluginStore(state => state.publishTasks) || []

  const columns: ColumnsType<PublishTask> = [
    {
      title: t('publishList.title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: t('publishList.platforms'),
      key: 'platforms',
      width: 150,
      render: (_, record) => (
        <div className={styles.platformTags}>
          {record.platformTasks.map(task => (
            <Tag key={task.platform} color="blue">
              {getPlatformName(task.platform as PluginPlatformType)}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: t('publishList.status'),
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={getStatusColor(record.overallStatus)}>
          {t(`common.${record.overallStatus}`)}
        </Tag>
      ),
    },
    {
      title: t('publishList.time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: time => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 120,
      render: (_, record) => (
        <a onClick={() => onViewDetail?.(record)}>
          {t('publishList.viewDetail')}
        </a>
      ),
    },
  ]

  return (
    <Modal
      title={t('publishList.title')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className={styles.publishListModal}
    >
      <div className={styles.publishListModal_content}>
        {publishTasks.length === 0
          ? (
              <div className={styles.empty}>
                <p>{t('publishList.empty')}</p>
              </div>
            )
          : (
              <Table
                columns={columns}
                dataSource={publishTasks}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: total => `${t('common.total')} ${total} ${t('common.items')}`,
                }}
              />
            )}
      </div>
    </Modal>
  )
}
