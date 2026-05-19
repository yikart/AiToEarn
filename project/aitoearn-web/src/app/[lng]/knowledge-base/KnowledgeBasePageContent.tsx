'use client'

import type { GlobalKnowledgeCategory, GlobalKnowledgeItem, GlobalKnowledgeScope } from '@/api/globalKnowledge'
import { globalKnowledgeApi } from '@/api/globalKnowledge'
import {
  BookOpenText,
  CheckCircle2,
  FileText,
  MessageSquareText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const initialKnowledgeItems: GlobalKnowledgeItem[] = [
  {
    id: 'global-offer-radar',
    title: '客户雷达核心价值',
    category: 'offer',
    scope: 'global',
    summary: 'AI 从内容、评论、互动信号里发现潜在客户，并按意向分排序。',
    replyUse: '客户提到没人咨询、找不到客户、内容没转化时，解释“先筛选高意向，再人工触达”的方案。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['主动获客', '线索评分', 'AI销售'],
  },
  {
    id: 'global-boundary-platform',
    title: '平台触达边界',
    category: 'boundary',
    scope: 'global',
    summary: '关键评论和私信进入确认队列，不做无节制全自动群发。',
    replyUse: '客户担心风控、封号、营销感太强时，强调人工确认、低频、低打扰。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['风控', '人工确认', '平台安全'],
  },
  {
    id: 'global-case-local-store',
    title: '本地门店获客案例话术',
    category: 'case',
    scope: 'global',
    summary: '门店先跑通同城搜索词、到店理由、私信承接，再扩大内容数量。',
    replyUse: '面对餐饮、咖啡、医美、家政、健身等门店时，先给具体诊断方向。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['本地生活', '门店', '案例'],
  },
  {
    id: 'global-tone-consultant',
    title: '回复语气规则',
    category: 'tone',
    scope: 'global',
    summary: '先给有帮助的判断，再轻柔提出可以继续诊断，不上来硬卖。',
    replyUse: '所有 AI 回复遵循“理解问题 -> 给一个可执行建议 -> 邀请进一步交流”。',
    updatedAt: '2026-05-18',
    enabled: true,
    tags: ['语气', '回复规范'],
  },
]

const categoryOptions: Array<GlobalKnowledgeCategory | 'all'> = ['all', 'offer', 'case', 'faq', 'boundary', 'tone']

function categoryLabel(category: GlobalKnowledgeCategory | 'all') {
  const map: Record<GlobalKnowledgeCategory | 'all', string> = {
    all: '全部',
    boundary: '边界',
    case: '案例',
    faq: 'FAQ',
    offer: '方案',
    tone: '语气',
  }
  return map[category]
}

function scopeLabel(scope: GlobalKnowledgeScope) {
  const map: Record<GlobalKnowledgeScope, string> = {
    account: '账号',
    campaign: '活动',
    global: '全局',
  }
  return map[scope]
}

const categoryClassName: Record<GlobalKnowledgeCategory, string> = {
  boundary: 'border-amber-200 bg-amber-50 text-amber-700',
  case: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  faq: 'border-slate-200 bg-slate-50 text-slate-600',
  offer: 'border-blue-200 bg-blue-50 text-blue-700',
  tone: 'border-cyan-200 bg-cyan-50 text-cyan-700',
}

export function KnowledgeBasePageContent() {
  const [items, setItems] = useState(initialKnowledgeItems)
  const [selectedId, setSelectedId] = useState(initialKnowledgeItems[0]?.id)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<GlobalKnowledgeCategory | 'all'>('all')
  const remoteLoadedRef = useRef(false)
  const saveTimerRef = useRef<number | null>(null)

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return items.filter((item) => {
      const categoryMatched = category === 'all' || item.category === category
      if (!categoryMatched)
        return false
      if (!keyword)
        return true

      return [
        item.title,
        item.summary,
        item.replyUse,
        ...item.tags,
      ].join(' ').toLowerCase().includes(keyword)
    })
  }, [category, items, query])
  const selectedItem = items.find(item => item.id === selectedId) || filteredItems[0] || items[0]
  const enabledCount = items.filter(item => item.enabled).length

  useEffect(() => {
    let cancelled = false

    async function loadKnowledge() {
      const res = await globalKnowledgeApi.list()
      if (cancelled)
        return

      if (res?.code === 0 && res.data?.length) {
        setItems(res.data)
        setSelectedId(res.data[0]?.id)
      }
      else if (res?.code === 0 && res.data?.length === 0) {
        const created = await Promise.all(initialKnowledgeItems.map(item => globalKnowledgeApi.create({
          category: item.category,
          enabled: item.enabled,
          replyUse: item.replyUse,
          scope: item.scope,
          summary: item.summary,
          tags: item.tags,
          title: item.title,
        })))
        if (!cancelled) {
          const nextItems = created.map(item => item?.data).filter(Boolean) as GlobalKnowledgeItem[]
          if (nextItems.length) {
            setItems(nextItems)
            setSelectedId(nextItems[0]?.id)
          }
        }
      }

      remoteLoadedRef.current = true
    }

    void loadKnowledge()

    return () => {
      cancelled = true
      if (saveTimerRef.current)
        window.clearTimeout(saveTimerRef.current)
    }
  }, [])

  function persistSelected(item: GlobalKnowledgeItem) {
    if (!remoteLoadedRef.current)
      return

    if (saveTimerRef.current)
      window.clearTimeout(saveTimerRef.current)

    saveTimerRef.current = window.setTimeout(() => {
      void globalKnowledgeApi.update(item.id, {
        category: item.category,
        enabled: item.enabled,
        replyUse: item.replyUse,
        scope: item.scope,
        summary: item.summary,
        tags: item.tags,
        title: item.title,
      })
    }, 600)
  }

  function updateSelected(patch: Partial<GlobalKnowledgeItem>) {
    if (!selectedItem)
      return

    const nextItem = { ...selectedItem, ...patch, updatedAt: new Date().toISOString().slice(0, 10) }
    setItems(current => current.map(item => item.id === selectedItem.id ? nextItem : item))
    persistSelected(nextItem)
  }

  async function createDraft() {
    const item: GlobalKnowledgeItem = {
      id: `global-draft-${Date.now()}`,
      title: '新的知识条目',
      category: 'faq',
      scope: 'global',
      summary: '填写这条知识的业务事实、产品规则或客户常问问题。',
      replyUse: '说明 AI 在什么场景应该引用这条知识。',
      updatedAt: '2026-05-18',
      enabled: true,
      tags: ['待完善'],
    }
    const res = await globalKnowledgeApi.create({
      category: item.category,
      enabled: item.enabled,
      replyUse: item.replyUse,
      scope: item.scope,
      summary: item.summary,
      tags: item.tags,
      title: item.title,
    })
    const nextItem = res?.code === 0 && res.data ? res.data : item
    setItems(current => [nextItem, ...current])
    setSelectedId(nextItem.id)
    toast.success('已创建知识草稿')
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-[#102033] md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#2563eb,#00bbd9_52%,#22c55e)] text-white shadow-[0_14px_34px_rgba(37,99,235,0.18)]">
                <BookOpenText className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">全局知识库</h1>
                  <Badge className="border-blue-100 bg-blue-50 text-blue-700 shadow-none" variant="outline">
                    AI 回复大脑
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  这里统一管理公司方案、案例、FAQ、平台边界和回复语气。客户雷达、自动评论、私信跟进、内容发布都应该从这里检索知识。
                </p>
              </div>
            </div>
            <Button className="bg-[#102033] hover:bg-[#182b45]" onClick={createDraft}>
              新建知识
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Metric icon={<FileText className="size-4" />} label="知识条目" value={items.length.toString()} />
            <Metric icon={<CheckCircle2 className="size-4" />} label="已启用" value={enabledCount.toString()} />
            <Metric icon={<MessageSquareText className="size-4" />} label="回复场景" value="4" />
            <Metric icon={<ShieldCheck className="size-4" />} label="风控规则" value="1" />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="space-y-3 border-b border-slate-100 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="搜索知识、标签、回复场景"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(option => (
                  <Button
                    key={option}
                    size="sm"
                    variant={category === option ? 'default' : 'outline'}
                    className={category === option ? 'bg-[#102033] hover:bg-[#182b45]' : ''}
                    onClick={() => setCategory(option)}
                  >
                    {categoryLabel(option)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="max-h-[680px] overflow-auto">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'block w-full border-b border-slate-100 px-5 py-4 text-left transition-colors hover:bg-slate-50',
                    selectedItem?.id === item.id && 'bg-blue-50/60',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{item.title}</span>
                    <Badge variant="outline" className={cn('shadow-none', categoryClassName[item.category])}>
                      {categoryLabel(item.category)}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.summary}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedItem && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">知识编辑</h2>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={selectedItem.enabled}
                    onCheckedChange={checked => updateSelected({ enabled: Boolean(checked) })}
                  />
                  启用
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="标题">
                  <Input value={selectedItem.title} onChange={event => updateSelected({ title: event.target.value })} />
                </Field>
                <Field label="作用范围">
                  <div className="grid grid-cols-3 gap-2">
                    {(['global', 'account', 'campaign'] as GlobalKnowledgeScope[]).map(scope => (
                      <Button
                        key={scope}
                        type="button"
                        variant={selectedItem.scope === scope ? 'default' : 'outline'}
                        className={selectedItem.scope === scope ? 'bg-[#102033] hover:bg-[#182b45]' : ''}
                        onClick={() => updateSelected({ scope })}
                      >
                        {scopeLabel(scope)}
                      </Button>
                    ))}
                  </div>
                </Field>
                <Field label="分类">
                  <div className="grid grid-cols-5 gap-2">
                    {(['offer', 'case', 'faq', 'boundary', 'tone'] as GlobalKnowledgeCategory[]).map(itemCategory => (
                      <Button
                        key={itemCategory}
                        type="button"
                        variant={selectedItem.category === itemCategory ? 'default' : 'outline'}
                        className={selectedItem.category === itemCategory ? 'bg-[#102033] hover:bg-[#182b45]' : ''}
                        onClick={() => updateSelected({ category: itemCategory })}
                      >
                        {categoryLabel(itemCategory)}
                      </Button>
                    ))}
                  </div>
                </Field>
                <Field label="标签">
                  <Input
                    value={selectedItem.tags.join('，')}
                    onChange={event => updateSelected({
                      tags: event.target.value.split(/[,\n，]/).map(tag => tag.trim()).filter(Boolean),
                    })}
                  />
                </Field>
                <Field label="知识摘要">
                  <Textarea
                    value={selectedItem.summary}
                    onChange={event => updateSelected({ summary: event.target.value })}
                    rows={5}
                  />
                </Field>
                <Field label="回复使用规则">
                  <Textarea
                    value={selectedItem.replyUse}
                    onChange={event => updateSelected({ replyUse: event.target.value })}
                    rows={5}
                  />
                </Field>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="size-4 text-blue-600" />
                  AI 调用逻辑
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  当客户画像、线索内容或历史记忆命中这些标签时，AI 回复会把该知识作为约束：先保证事实一致，再生成适合当前客户的评论或私信话术。
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
      <div className="flex size-9 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function Field({ children, label }: { children: React.ReactNode, label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
