/**
 * AgentTab - Agent 设置 Tab
 */

'use client'

import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getChatModels, putUserAiConfigItem } from '@/api/ai'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'

interface ChatModel {
  name: string
  description?: string
  logo?: string
  pricing?: {
    prompt?: string
    completion?: string
  }
  tags?: string[]
  mainTag?: boolean
}

export function AgentTab() {
  const { t } = useTransClient('settings')
  const userInfo = useUserStore(state => state.userInfo)
  const getUserInfo = useUserStore(state => state.getUserInfo)

  const [chatModels, setChatModels] = useState<ChatModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 获取用户当前的默认模型
  useEffect(() => {
    const agentConfig = (userInfo as any)?.aiConfig?.agent
    if (agentConfig?.defaultModel) {
      setSelectedModel(agentConfig.defaultModel)
    }
  }, [userInfo])

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await getChatModels()
        if (res?.code === 0 && res.data) {
          const models = res.data as ChatModel[]
          setChatModels(models)
          // 如果用户没有设置默认模型，使用第一个
          if (!selectedModel && models.length > 0) {
            setSelectedModel(models[0].name)
          }
        }
      }
      catch (error) {
        console.error('获取模型列表失败:', error)
      }
      finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  // 打开弹窗时聚焦搜索框
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  // 过滤模型列表
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return chatModels
    const query = searchQuery.toLowerCase()
    return chatModels.filter(
      model =>
        model.name.toLowerCase().includes(query)
        || (model.description?.toLowerCase().includes(query)),
    )
  }, [chatModels, searchQuery])

  // 保存模型设置
  const handleSave = async () => {
    if (!selectedModel) {
      toast.error(t('agent.pleaseSelectModel'))
      return
    }

    setSaving(true)
    try {
      const res = await putUserAiConfigItem({
        type: 'agent',
        value: {
          defaultModel: selectedModel,
          option: {},
        },
      })

      if (res?.code === 0) {
        toast.success(t('agent.saveSuccess'))
        await getUserInfo()
      }
      else {
        toast.error(res?.message || t('agent.saveFailed'))
      }
    }
    catch (error) {
      toast.error(t('agent.saveFailed'))
    }
    finally {
      setSaving(false)
    }
  }

  // 当前选中的模型信息
  const currentModel = chatModels.find(m => m.name === selectedModel)

  return (
    <div className="space-y-6">
      {/* 模型选择 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Default Model
        </label>
        <p className="mb-4 text-sm text-gray-500">
          Select the default AI model for Agent conversations
        </p>

        <div className="space-y-4">
          {loading
            ? (
                <Skeleton className="h-12 w-full rounded-md" />
              )
            : (
                <Popover open={open} onOpenChange={setOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="h-auto min-h-[56px] w-full justify-between px-4 py-3"
                    >
                      {currentModel
                        ? (
                            <div className="flex items-center gap-3">
                              {currentModel.logo
                                ? (
                                    <Image
                                      src={currentModel.logo}
                                      alt={currentModel.name}
                                      width={28}
                                      height={28}
                                      className="shrink-0 rounded"
                                    />
                                  )
                                : (
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600">
                                      AI
                                    </div>
                                  )}
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium text-gray-900">
                                  {currentModel.description || currentModel.name}
                                </span>
                                {currentModel.pricing && (
                                  <span className="text-xs font-normal text-gray-400">
                                    Input: {currentModel.pricing.prompt}
                                    {currentModel.pricing.completion && ` · Output: ${currentModel.pricing.completion}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        : (
                            <span className="text-gray-400">Select a model...</span>
                          )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    {/* 搜索框 */}
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search models..."
                        className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="ml-2 rounded p-1 hover:bg-gray-100"
                        >
                          <X className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                      )}
                    </div>

                    {/* 模型列表 */}
                    <div
                      className="max-h-[320px] overflow-y-auto p-1"
                      onWheel={(e) => {
                        // 阻止滚动事件冒泡，确保只在此容器内滚动
                        e.stopPropagation()
                      }}
                    >
                      {filteredModels.length === 0
                        ? (
                            <div className="py-6 text-center text-sm text-gray-500">
                              No model found.
                            </div>
                          )
                        : (
                            filteredModels.map(model => (
                              <button
                                key={model.name}
                                onClick={() => {
                                  setSelectedModel(model.name)
                                  setOpen(false)
                                }}
                                className={cn(
                                  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-3 text-left transition-colors',
                                  selectedModel === model.name
                                    ? 'bg-purple-50'
                                    : 'hover:bg-gray-100',
                                )}
                              >
                                <div className="flex flex-1 items-center gap-3">
                                  {model.logo
                                    ? (
                                        <Image
                                          src={model.logo}
                                          alt={model.name}
                                          width={28}
                                          height={28}
                                          className="shrink-0 rounded"
                                        />
                                      )
                                    : (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-500">
                                          AI
                                        </div>
                                      )}
                                  <div className="flex min-w-0 flex-1 flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-medium text-gray-900">
                                        {model.description || model.name}
                                      </span>
                                      {model.mainTag && (
                                        <span className="shrink-0 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                                          New
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap gap-1">
                                      {(model.tags || []).slice(0, 3).map(tag => (
                                        <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                    {model.pricing && (
                                      <span className="mt-1 text-xs text-gray-400">
                                        Input: {model.pricing.prompt}
                                        {model.pricing.completion && ` · Output: ${model.pricing.completion}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Check
                                  className={cn(
                                    'ml-2 h-4 w-4 shrink-0 text-purple-600',
                                    selectedModel === model.name ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                              </button>
                            ))
                          )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

          {/* 保存按钮 */}
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
