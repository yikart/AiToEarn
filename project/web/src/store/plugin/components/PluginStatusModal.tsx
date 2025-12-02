/**
 * 插件状态弹框组件
 * 三种状态：未安装、已安装未授权、已就绪
 */

'use client'

import type { PluginPlatformType, PublishTask } from '../types/baseTypes'
import {
  ApiOutlined,
  CheckCircleOutlined,
  ChromeOutlined,
  ExclamationCircleOutlined,
  GithubOutlined,
  LoginOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Divider, Empty, Modal, Space, Spin, Tag, Tooltip } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import AvatarPlat from '@/components/AvatarPlat'
import { usePluginStore } from '../store'
import { PLUGIN_SUPPORTED_PLATFORMS, PluginStatus } from '../types/baseTypes'
import styles from './PluginStatusModal.module.scss'
import { PublishDetailModal } from './PublishDetailModal'
import { PublishListModal } from './PublishListModal'

/**
 * 组件属性
 */
export interface PluginStatusModalProps {
  /** 是否显示 */
  visible: boolean

  /** 关闭回调 */
  onClose: () => void
}

/**
 * 插件下载链接配置
 */
const DOWNLOAD_LINKS = {
  chrome: 'https://chromewebstore.google.com/detail/aitoearn',
  github: 'https://github.com/yikart/AiToEarn/releases',
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
 * 插件状态弹框组件
 */
export function PluginStatusModal({ visible, onClose }: PluginStatusModalProps) {
  const { t } = useTranslation('plugin')
  const status = usePluginStore(state => state.status)
  const platformAccounts = usePluginStore(state => state.platformAccounts)
  const publishTasks = usePluginStore(state => state.publishTasks)
  const init = usePluginStore(state => state.init)
  const login = usePluginStore(state => state.login)

  const [loading, setLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState<PluginPlatformType | null>(null)
  const [showPublishList, setShowPublishList] = useState(false)
  const [showPublishDetail, setShowPublishDetail] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PublishTask | null>(null)

  // 状态判断
  const isReady = status === PluginStatus.READY
  const isInstalledNoPermission = status === PluginStatus.INSTALLED_NO_PERMISSION
  const isNotInstalled = status === PluginStatus.NOT_INSTALLED || status === PluginStatus.UNKNOWN

  /**
   * 处理平台登录
   */
  const handleLogin = async (platform: PluginPlatformType) => {
    setLoginLoading(platform)
    try {
      await login(platform)
    }
    catch (error) {
      console.error('登录失败:', error)
    }
    finally {
      setLoginLoading(null)
    }
  }

  /**
   * 处理查看发布详情
   */
  const handleViewDetail = (task: PublishTask) => {
    setSelectedTask(task)
    setShowPublishDetail(true)
  }

  /**
   * 获取弹框标题
   */
  const getModalTitle = () => {
    if (isReady)
      return t('status.ready')
    if (isInstalledNoPermission)
      return t('status.installedNoPermission')
    return t('status.notInstalled')
  }

  /**
   * 渲染未安装状态内容
   */
  const renderNotInstalledContent = () => (
    <div className={styles.inactiveContent}>
      <div className={styles.iconWrapper}>
        <ApiOutlined className={styles.downloadIcon} />
      </div>
      <h3 className={styles.title}>{t('header.downloadPlugin')}</h3>
      <p className={styles.description}>{t('header.downloadDescription')}</p>
      <div className={styles.downloadButtons}>
        <Button
          type="primary"
          size="large"
          icon={<ChromeOutlined />}
          href={DOWNLOAD_LINKS.chrome}
          target="_blank"
        >
          {t('header.chromeWebStore')}
        </Button>
        <Button
          size="large"
          icon={<GithubOutlined />}
          href={DOWNLOAD_LINKS.github}
          target="_blank"
        >
          {t('header.githubRelease')}
        </Button>
      </div>
    </div>
  )

  /**
   * 渲染已安装但未授权状态内容
   */
  const renderNoPermissionContent = () => (
    <div className={styles.inactiveContent}>
      <div className={`${styles.iconWrapper} ${styles.warningIcon}`}>
        <ExclamationCircleOutlined className={styles.downloadIcon} />
      </div>
      <h3 className={styles.title}>{t('header.permissionRequired')}</h3>
      <p className={styles.description}>{t('header.permissionDescription')}</p>
      <div className={styles.downloadButtons}>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            // 重新初始化以检查权限
            setLoading(true)
            init().finally(() => setLoading(false))
          }}
        >
          {t('header.checkPermission')}
        </Button>
      </div>
    </div>
  )

  /**
   * 渲染已就绪状态内容
   */
  const renderReadyContent = () => (
    <Spin spinning={loading}>
      <div className={styles.activeContent}>
        {/* 顶部状态提示 */}
        <div className={styles.statusBanner}>
          <CheckCircleOutlined className={styles.checkIcon} />
          <span>{t('header.activeDescription')}</span>
        </div>

        {/* 平台账号列表 */}
        <div className={styles.platformSection}>
          <h4 className={styles.sectionTitle}>{t('header.platformAccounts')}</h4>
          <div className={styles.platformList}>
            {PLUGIN_SUPPORTED_PLATFORMS.map((platform) => {
              const account = platformAccounts[platform]
              const isLogging = loginLoading === platform

              return (
                <Card
                  key={platform}
                  size="small"
                  className={styles.platformCard}
                >
                  <div className={styles.platformInfo}>
                    <div className={styles.platformLeft}>
                      {/* 使用 AvatarPlat 组件显示带平台图标的头像 */}
                      {account
                        ? (
                            <AvatarPlat
                              account={{
                                type: platform,
                                avatar: account.avatar || '',
                                nickname: account.nickname || '',
                                uid: account.uid || '',
                                id: '0',
                                fansCount: account.fansCount || 0,
                              }}
                              size="large"
                              avatarWidth={40}
                            />
                          )
                        : (
                            <Avatar
                              size={40}
                              icon={<UserOutlined />}
                              className={styles.avatar}
                            />
                          )}
                      <div className={styles.accountInfo}>
                        <div className={styles.platformName}>
                          {getPlatformName(platform)}
                        </div>
                        {account
                          ? (
                              <div className={styles.accountName}>
                                {account.nickname || account.uid}
                              </div>
                            )
                          : (
                              <div className={styles.notLoggedIn}>
                                {t('header.notLoggedIn')}
                              </div>
                            )}
                      </div>
                    </div>
                    <div className={styles.platformRight}>
                      {account
                        ? (
                            <Tag color="success">{t('status.connected')}</Tag>
                          )
                        : (
                            <Tooltip title={t('header.loginNow')}>
                              <Button
                                type="link"
                                size="small"
                                loading={isLogging}
                                icon={<LoginOutlined />}
                                onClick={() => handleLogin(platform)}
                              >
                                {t('header.loginNow')}
                              </Button>
                            </Tooltip>
                          )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <Divider />

        {/* 最近发布任务 */}
        <div className={styles.publishSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>{t('publishList.title')}</h4>
            <Button
              type="link"
              size="small"
              onClick={() => setShowPublishList(true)}
            >
              {t('header.viewPublishList')}
            </Button>
          </div>

          {publishTasks.length === 0
            ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('publishList.empty')}
                />
              )
            : (
                <div className={styles.recentTasks}>
                  {publishTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className={styles.taskItem}
                      onClick={() => handleViewDetail(task)}
                    >
                      <div className={styles.taskInfo}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <Space size={4}>
                          {task.platformTasks.map(pt => (
                            <Tag key={pt.platform} color="blue">
                              {getPlatformName(pt.platform as PluginPlatformType)}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                      <Tag color={getStatusColor(task.overallStatus)}>
                        {t(`common.${task.overallStatus}`)}
                      </Tag>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    </Spin>
  )

  /**
   * 渲染内容
   */
  const renderContent = () => {
    if (isReady) {
      return renderReadyContent()
    }
    if (isInstalledNoPermission) {
      return renderNoPermissionContent()
    }
    return renderNotInstalledContent()
  }

  return (
    <>
      <Modal
        title={getModalTitle()}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={500}
        className={styles.pluginStatusModal}
        centered
      >
        {renderContent()}
      </Modal>

      {/* 发布列表弹框 */}
      <PublishListModal
        visible={showPublishList}
        onClose={() => setShowPublishList(false)}
        onViewDetail={(task) => {
          setSelectedTask(task)
          setShowPublishList(false)
          setShowPublishDetail(true)
        }}
      />

      {/* 发布详情弹框 */}
      <PublishDetailModal
        visible={showPublishDetail}
        onClose={() => {
          setShowPublishDetail(false)
          setSelectedTask(null)
        }}
        task={selectedTask || undefined}
      />
    </>
  )
}

/**
 * 获取状态颜色
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'PUBLISHING':
      return 'processing'
    case 'ERROR':
      return 'error'
    default:
      return 'default'
  }
}
