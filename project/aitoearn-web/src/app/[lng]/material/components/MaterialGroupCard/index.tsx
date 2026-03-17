/**
 * MaterialGroupCard - 素材分组卡片组件
 * 展示素材分组的封面、标题、描述、类型和资源数量
 */

'use client'

import type { MediaGroup } from '../../materialStore'
import { Edit, Image as ImageIcon, MoreVertical, Trash2, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTransClient } from '@/app/i18n/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

interface MaterialGroupCardProps {
  /** 分组数据 */
  group: MediaGroup
  /** 编辑回调 */
  onEdit: (group: MediaGroup) => void
  /** 删除回调 */
  onDelete: (id: string) => void
  /** 是否正在删除 */
  isDeleting?: boolean
}

export function MaterialGroupCard({ group, onEdit, onDelete, isDeleting }: MaterialGroupCardProps) {
  const { t } = useTransClient('material')

  // 处理编辑
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(group)
  }

  // 处理删除
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const confirmed = await confirm({
      title: t('mediaManagement.delete'),
      content: t('mediaManagement.deleteConfirm'),
      okText: t('mediaManagement.delete'),
      cancelText: t('mediaManagement.cancel'),
      okType: 'destructive',
    })
    if (confirmed) {
      onDelete(group._id)
    }
  }

  // 判断是否有封面（视频有 thumbUrl 时也算有封面）
  const hasCover = group.cover || group.previewMedia?.thumbUrl
  const coverUrl
    = group.cover || (group.previewMedia?.thumbUrl ? getOssUrl(group.previewMedia.thumbUrl) : '')
  const isVideo = group.type === 'video'
  const isDefault = group.isDefault

  // 构建链接 URL
  const params = new URLSearchParams({
    title: group.title,
    type: group.type,
    desc: group.desc || '',
  })
  const href = `/material/album/${group._id}?${params.toString()}`

  // 获取描述文本
  const getDescription = () => {
    if (isDefault) {
      return isVideo
        ? t('mediaManagement.defaultVideoGroupDesc')
        : t('mediaManagement.defaultImageGroupDesc')
    }
    return group.desc || t('mediaManagement.noDescription')
  }

  return (
    <Link
      href={href}
      className={cn(
        'block rounded-xl border border-border bg-card overflow-hidden cursor-pointer group',
        'hover:shadow-lg transition-shadow duration-200',
        isDeleting && 'opacity-50 pointer-events-none',
      )}
    >
      {/* 封面区域 */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {hasCover ? (
          // 图片/视频缩略图封面
          <Image
            src={coverUrl}
            alt={group.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          // 无封面占位符
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center',
              isVideo
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                : 'bg-gradient-to-br from-green-500/20 to-teal-500/20',
            )}
          >
            {isVideo ? (
              <>
                <Video className="w-12 h-12 text-blue-500/60 mb-2" />
                <span className="text-sm text-muted-foreground">{t('mediaManagement.video')}</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-green-500/60 mb-2" />
                <span className="text-sm text-muted-foreground">{t('mediaManagement.image')}</span>
              </>
            )}
          </div>
        )}

        {/* 默认标签 */}
        {isDefault && (
          <Badge className="absolute top-3 left-3 bg-amber-500/90 hover:bg-amber-500/90 text-white border-0 backdrop-blur-sm">
            {t('mediaManagement.default')}
          </Badge>
        )}

        {/* 类型徽章 */}
        <Badge
          className={cn(
            'absolute bottom-3 left-3 backdrop-blur-sm',
            isVideo
              ? 'bg-blue-500/80 hover:bg-blue-500/80 text-white'
              : 'bg-green-500/80 hover:bg-green-500/80 text-white',
          )}
        >
          {isVideo ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
          {isVideo ? t('mediaManagement.video') : t('mediaManagement.image')}
        </Badge>

        {/* 资源数量 */}
        <Badge
          variant="secondary"
          className="absolute bottom-3 right-3 backdrop-blur-sm bg-black/50 hover:bg-black/50 text-white border-0"
        >
          {group.count}
          {' '}
          {t('mediaManagement.resources')}
        </Badge>

        {/* 更多操作菜单（非默认组才显示） */}
        {!isDefault && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('mediaManagement.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('mediaManagement.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        {/* 标题 */}
        <h3 className="font-medium text-foreground truncate mb-1">{group.title}</h3>

        {/* 描述 */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {getDescription()}
        </p>
      </div>
    </Link>
  )
}
