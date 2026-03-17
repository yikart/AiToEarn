/**
 * MaterialHeader - 素材库页面顶部组件
 * 包含返回按钮、标题、类型筛选、搜索框、创建按钮
 */

'use client'

import type { FilterType } from '../../materialStore'
import { ArrowLeft, FolderOpen, Image, Plus, Search, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface MaterialHeaderProps {
  /** 总数量 */
  total: number
  /** 当前筛选类型 */
  filterType: FilterType
  /** 筛选类型变化回调 */
  onFilterChange: (type: FilterType) => void
  /** 搜索文本 */
  searchText: string
  /** 搜索文本变化回调 */
  onSearchChange: (text: string) => void
  /** 创建按钮点击回调 */
  onCreateClick: () => void
  /** 是否加载中 */
  isLoading?: boolean
}

export function MaterialHeader({
  total,
  filterType,
  onFilterChange,
  searchText,
  onSearchChange,
  onCreateClick,
  isLoading,
}: MaterialHeaderProps) {
  const { t } = useTransClient('material')
  const router = useRouter()

  // 本地搜索状态（用于防抖）
  const [localSearch, setLocalSearch] = useState(searchText)

  // 同步外部搜索文本
  useEffect(() => {
    setLocalSearch(searchText)
  }, [searchText])

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchText) {
        onSearchChange(localSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, searchText, onSearchChange])

  // 返回首页
  const handleBack = useCallback(() => {
    router.push('/')
  }, [router])

  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border">
      {/* 第一行：标题和操作 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="w-8 h-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{t('mediaManagement.title')}</h1>
          </div>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              (
              {total}
              )
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 桌面端筛选 Tabs */}
          <Tabs
            value={filterType}
            onValueChange={value => onFilterChange(value as FilterType)}
            className="hidden sm:block"
          >
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-sm px-3">
                {t('mediaManagement.all')}
              </TabsTrigger>
              <TabsTrigger value="video" className="text-sm px-3">
                <Video className="w-4 h-4 mr-1" />
                {t('mediaManagement.video')}
              </TabsTrigger>
              <TabsTrigger value="img" className="text-sm px-3">
                <Image className="w-4 h-4 mr-1" />
                {t('mediaManagement.image')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 创建按钮 */}
          <Button onClick={onCreateClick} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t('mediaManagement.createGroup')}</span>
            <span className="sm:hidden">{t('mediaManagement.create')}</span>
          </Button>
        </div>
      </div>

      {/* 第二行：移动端筛选 + 搜索 */}
      <div className="px-4 pb-3 flex flex-col sm:flex-row gap-3">
        {/* 移动端筛选 Tabs */}
        <Tabs
          value={filterType}
          onValueChange={value => onFilterChange(value as FilterType)}
          className="sm:hidden"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">{t('mediaManagement.all')}</TabsTrigger>
            <TabsTrigger value="video">
              <Video className="w-4 h-4 mr-1" />
              {t('mediaManagement.video')}
            </TabsTrigger>
            <TabsTrigger value="img">
              <Image className="w-4 h-4 mr-1" />
              {t('mediaManagement.image')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('mediaManagement.searchPlaceholder')}
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className={cn('pl-9 h-9', isLoading && 'opacity-50')}
            disabled={isLoading}
          />
        </div>
      </div>
    </header>
  )
}
