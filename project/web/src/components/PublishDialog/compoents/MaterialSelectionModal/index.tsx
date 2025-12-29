/**
 * MaterialSelectionModal - 素材选择弹窗
 * 用于从素材库中选择图片或视频素材
 */

import type {
  ForwardedRef,
} from 'react'
import { PictureOutlined } from '@ant-design/icons'
import { Button, List, Spin } from 'antd'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { getMediaGroupList, getMediaList } from '@/api/media'
import { useTransClient } from '@/app/i18n/client'
import { Modal } from '@/components/ui/modal'
import { getOssUrl } from '@/utils/oss'

export interface IMaterialSelectionModalRef {}

export interface IMaterialSelectionModalProps {
  allowImage?: boolean
  allowVideo?: boolean
  libraryModalOpen: boolean
  onCancel: () => void
  onSelected?: (item: any) => void
}

const MaterialSelectionModal = memo(
  forwardRef(
    (
      {
        allowImage = true,
        allowVideo = true,
        libraryModalOpen,
        onCancel,
        onSelected,
      }: IMaterialSelectionModalProps,
      ref: ForwardedRef<IMaterialSelectionModalRef>,
    ) => {
      // 素材库选择弹窗/数据
      const [libraryGroupLoading, setLibraryGroupLoading] = useState(false)
      const [libraryGroups, setLibraryGroups] = useState<any[]>([])
      const [selectedLibraryGroup, setSelectedLibraryGroup] = useState<
        any | null
      >(null)
      const [libraryLoading, setLibraryLoading] = useState(false)
      const [libraryItems, setLibraryItems] = useState<any[]>([])
      const { t } = useTransClient('publish')

      // 获取素材库组列表
      const fetchLibraryGroups = useCallback(async () => {
        try {
          setLibraryGroupLoading(true)
          const res: any = await getMediaGroupList(1, 100)
          const list = res?.data?.list || []
          const filtered = list.filter((g: any) => {
            if (g.type === 'img')
              return allowImage
            if (g.type === 'video')
              return allowVideo
            return true
          })
          setLibraryGroups(filtered)
        }
        catch (e) {
        }
        finally {
          setLibraryGroupLoading(false)
        }
      }, [allowImage, allowVideo])

      // 获取素材库内容
      const fetchLibraryItems = useCallback(async (groupId: string) => {
        try {
          setLibraryLoading(true)
          const res: any = await getMediaList(groupId, 1, 100)
          setLibraryItems(res?.data?.list || [])
        }
        catch (e) {
        }
        finally {
          setLibraryLoading(false)
        }
      }, [])

      // 素材库弹窗打开时获取组列表
      useEffect(() => {
        if (libraryModalOpen) {
          setSelectedLibraryGroup(null)
          setLibraryItems([])
          fetchLibraryGroups()
        }
      }, [libraryModalOpen, fetchLibraryGroups])

      // 选中素材库组后加载组内素材
      useEffect(() => {
        if (selectedLibraryGroup?._id) {
          fetchLibraryItems(selectedLibraryGroup._id)
        }
      }, [selectedLibraryGroup, fetchLibraryItems])

      // 选择素材库内容后填充参数
      const applyLibraryItem = useCallback(async (item: any) => {
        if (onSelected) {
          onSelected(item)
          onCancel()
        }
      }, [])

      return (
        <Modal
          open={libraryModalOpen}
          onCancel={() => onCancel()}
          footer={null}
          title={
            selectedLibraryGroup
              ? t('draft.selectLibraryItem')
              : t('draft.selectLibraryGroup')
          }
          width={720}
        >
          {!selectedLibraryGroup
            ? (
                <div>
                  {libraryGroupLoading
                    ? (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                          <Spin />
                        </div>
                      )
                    : (
                        <List
                          grid={{ gutter: 16, column: 2 }}
                          dataSource={libraryGroups}
                          locale={{ emptyText: t('draft.noLibraryGroups') }}
                          renderItem={(item: any) => (
                            <List.Item>
                              <div
                                style={{
                                  background: '#F0F8FF',
                                  border: '2px solid transparent',
                                  padding: '16px',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  minHeight: '80px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  position: 'relative',
                                }}
                                onClick={() => setSelectedLibraryGroup(item)}
                              >
                                <div
                                  style={{
                                    fontSize: 24,
                                    marginBottom: 8,
                                    color: '#1890ff',
                                  }}
                                >
                                  <PictureOutlined />
                                </div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 16,
                                    color: '#2c3e50',
                                    marginBottom: 4,
                                  }}
                                >
                                  {item.title}
                                </div>
                                {item.desc && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: '#7f8c8d',
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {item.desc}
                                  </div>
                                )}
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: 10,
                                    color: '#fff',
                                    background:
                              item.type === 'img' ? '#52c41a' : '#1890ff',
                                  }}
                                >
                                  {item.type === 'img'
                                    ? t('draft.imageGroup')
                                    : t('draft.videoGroup')}
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      )}
                </div>
              )
            : (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <Button
                      type="link"
                      onClick={() => setSelectedLibraryGroup(null)}
                    >
                      {t('draft.backToLibraryGroups')}
                    </Button>
                  </div>
                  {libraryLoading
                    ? (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                          <Spin />
                        </div>
                      )
                    : (
                        <List
                          grid={{ gutter: 16, column: 2 }}
                          dataSource={libraryItems}
                          locale={{ emptyText: t('draft.noLibraryItems') }}
                          renderItem={(item: any) => (
                            <List.Item>
                              <div
                                style={{
                                  border: '1px solid #eee',
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                }}
                                onClick={() => applyLibraryItem(item)}
                              >
                                <div
                                  style={{
                                    width: '100%',
                                    paddingTop: '56%',
                                    position: 'relative',
                                    background: '#f7f7f7',
                                  }}
                                >
                                  {item.type === 'img'
                                    ? (
                                        <img
                                          src={getOssUrl(item.url)}
                                          alt=""
                                          style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                          }}
                                        />
                                      )
                                    : (
                                        <video
                                          src={getOssUrl(item.url)}
                                          style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                          }}
                                        />
                                      )}
                                </div>
                                <div style={{ padding: 8 }}>
                                  <div style={{ fontWeight: 600 }}>
                                    {item.title || '-'}
                                  </div>
                                  <div style={{ fontSize: 12, color: '#999' }}>
                                    {item.desc || ''}
                                  </div>
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      )}
                </div>
              )}
        </Modal>
      )
    },
  ),
)

export default MaterialSelectionModal
