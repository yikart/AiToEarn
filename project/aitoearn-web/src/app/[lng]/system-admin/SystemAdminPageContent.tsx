'use client'

import type { CustomerTenantPlan, SystemAiConfig } from '@/api/systemSettings'
import {
  Bot,
  CheckCircle2,
  Database,
  FileText,
  KeyRound,
  RefreshCw,
  Save,
  ServerCog,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { systemSettingsApi } from '@/api/systemSettings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
import { isSystemAdminUser } from '@/utils/systemAdmin'

const defaultConfig: SystemAiConfig = {
  anthropicBaseUrl: 'https://api.anthropic.com',
  openaiBaseUrl: 'https://api.openai.com/v1',
}

export function SystemAdminPageContent() {
  const [config, setConfig] = useState<SystemAiConfig>(defaultConfig)
  const [tenants, setTenants] = useState<CustomerTenantPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTenants, setSavingTenants] = useState(false)
  const token = useUserStore(state => state.token)
  const userInfo = useUserStore(state => state.userInfo)
  const hasHydrated = useUserStore(state => state._hasHydrated)
  const isAdmin = isSystemAdminUser(userInfo)
  const hasUserInfo = Boolean(userInfo?.id || userInfo?.mail)

  useEffect(() => {
    if (!hasHydrated || !token || !hasUserInfo)
      return

    if (!isAdmin) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadAdminData() {
      try {
        const [configRes, tenantsRes] = await Promise.all([
          systemSettingsApi.getAiConfig(),
          systemSettingsApi.getCustomerTenants(),
        ])
        if (cancelled)
          return
        if (configRes?.code === 0 && configRes.data)
          setConfig({ ...defaultConfig, ...configRes.data })
        if (tenantsRes?.code === 0 && tenantsRes.data)
          setTenants(tenantsRes.data)
      }
      finally {
        if (!cancelled)
          setLoading(false)
      }
    }

    void loadAdminData()
    return () => {
      cancelled = true
    }
  }, [hasHydrated, hasUserInfo, isAdmin, token])

  function updateConfig(patch: Partial<SystemAiConfig>) {
    setConfig(current => ({ ...current, ...patch }))
  }

  async function handleSave() {
    setSaving(true)
    const res = await systemSettingsApi.saveAiConfig(config)
    setSaving(false)

    if (res?.code === 0) {
      setConfig({ ...defaultConfig, ...res.data })
      toast.success('模型配置已保存')
      return
    }

    toast.error(res?.message || '模型配置保存失败')
  }

  function updateTenant(userId: string, patch: Partial<CustomerTenantPlan>) {
    setTenants(current => current.map(item => item.userId === userId ? { ...item, ...patch } : item))
  }

  async function handleSaveTenants() {
    setSavingTenants(true)
    const res = await systemSettingsApi.saveCustomerTenants(tenants)
    setSavingTenants(false)

    if (res?.code === 0) {
      toast.success('客户套餐已保存')
      return
    }

    toast.error(res?.message || '客户套餐保存失败')
  }

  const activeTenantCount = tenants.filter(item => item.status === 'active' || item.status === 'trial').length
  const totalLeads = tenants.reduce((sum, item) => sum + (item.metrics?.leads || 0), 0)
  const totalTasks = tenants.reduce((sum, item) => sum + (item.metrics?.tasks || 0), 0)

  if (!hasHydrated || (token && !hasUserInfo)) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-[#102033] md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          正在确认账号权限...
        </div>
      </main>
    )
  }

  if (!token || !isAdmin) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-[#102033] md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ShieldCheck className="size-5 text-blue-600" />
            无系统管理权限
          </div>
          <p className="text-sm leading-6 text-slate-600">
            当前账号只能使用自己的频道、知识库和客户雷达。系统管理仅对部署管理员开放。
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-[#102033] md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#2563eb,#00bbd9_52%,#22c55e)] text-white shadow-[0_14px_34px_rgba(37,99,235,0.18)]">
                <ServerCog className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">系统管理</h1>
                  <Badge className="border-blue-100 bg-blue-50 text-blue-700 shadow-none" variant="outline">
                    私有化部署
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  管理全局模型 Key、多客户隔离状态和平台执行方式。客户登录后使用自己的账号、知识库、客户雷达和执行任务。
                </p>
              </div>
            </div>
            <Button className="bg-[#102033] hover:bg-[#182b45]" disabled={saving || loading} onClick={handleSave}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              保存模型配置
            </Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Metric icon={<UsersRound className="size-4" />} label="客户空间" value={`${activeTenantCount}/${tenants.length || 0}`} />
            <Metric icon={<Database className="size-4" />} label="线索总量" value={totalLeads.toString()} />
            <Metric icon={<ShieldCheck className="size-4" />} label="任务总量" value={totalTasks.toString()} />
            <Metric icon={<Bot className="size-4" />} label="AI 配置" value="全局统一" />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound className="size-5 text-blue-600" />
              <h2 className="text-lg font-semibold">模型 Key 配置</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="OpenAI Base URL">
                <Input value={config.openaiBaseUrl || ''} onChange={event => updateConfig({ openaiBaseUrl: event.target.value })} />
              </Field>
              <Field label="OpenAI API Key">
                <Input type="password" value={config.openaiApiKey || ''} onChange={event => updateConfig({ openaiApiKey: event.target.value })} placeholder="sk-..." />
              </Field>
              <Field label="Claude Base URL">
                <Input value={config.anthropicBaseUrl || ''} onChange={event => updateConfig({ anthropicBaseUrl: event.target.value })} />
              </Field>
              <Field label="Claude API Key">
                <Input type="password" value={config.anthropicApiKey || ''} onChange={event => updateConfig({ anthropicApiKey: event.target.value })} placeholder="sk-ant-..." />
              </Field>
              <Field label="Gemini API Key">
                <Input type="password" value={config.geminiApiKey || ''} onChange={event => updateConfig({ geminiApiKey: event.target.value })} />
              </Field>
              <Field label="Grok API Key">
                <Input type="password" value={config.grokApiKey || ''} onChange={event => updateConfig({ grokApiKey: event.target.value })} />
              </Field>
              <Field label="火山引擎 API Key">
                <Input type="password" value={config.volcengineApiKey || ''} onChange={event => updateConfig({ volcengineApiKey: event.target.value })} />
              </Field>
              <Field label="默认聊天模型">
                <Input value={config.defaultChatModel || ''} onChange={event => updateConfig({ defaultChatModel: event.target.value })} placeholder="例如：gpt-5.1-all" />
              </Field>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">多客户运行逻辑</h2>
            </div>
            <div className="space-y-3">
              <StatusRow title="客户登录" value="邮箱/手机验证码注册登录" />
              <StatusRow title="数据隔离" value="后端接口使用当前 token.id 读写" />
              <StatusRow title="客户雷达" value="每个客户独立保存配置、线索、客户库、日志" />
              <StatusRow title="知识库" value="每个客户独立维护 AI 回复知识" />
              <StatusRow title="平台账号" value="客户本机插件读取自己的浏览器登录态" />
              <StatusRow title="服务器执行" value="后续可升级为云端托管浏览器 Worker" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <UsersRound className="size-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">客户空间与套餐</h2>
                <p className="mt-1 text-sm text-slate-500">
                  每个登录用户对应一个独立客户空间，拥有自己的知识库、客户雷达、插件状态、线索池和任务额度。
                </p>
              </div>
            </div>
            <Button className="bg-[#102033] hover:bg-[#182b45]" disabled={savingTenants || loading} onClick={handleSaveTenants}>
              {savingTenants ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              保存客户套餐
            </Button>
          </div>

          <div className="grid gap-4 p-5">
            {tenants.length ? tenants.map(tenant => (
              <div key={tenant.userId} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{tenant.customerName || tenant.mail || tenant.userId}</h3>
                      <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700 shadow-none">
                        {tenant.packageName}
                      </Badge>
                      <Badge variant="outline" className={tenant.status === 'paused' ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-none' : 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none'}>
                        {tenant.status === 'active' ? '正式' : tenant.status === 'trial' ? '试用' : '暂停'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {tenant.mail || '未绑定邮箱'}
                      {' '}
                      ·
                      {' '}
                      {tenant.tenantId}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                      <MiniStat label="线索" value={tenant.metrics?.leads || 0} />
                      <MiniStat label="客户" value={tenant.metrics?.customers || 0} />
                      <MiniStat label="任务" value={tenant.metrics?.tasks || 0} />
                    </div>
                  </div>

                  <div className="grid w-full gap-3 md:grid-cols-3 xl:max-w-3xl">
                    <Field label="客户名称">
                      <Input value={tenant.customerName || ''} onChange={event => updateTenant(tenant.userId, { customerName: event.target.value })} />
                    </Field>
                    <Field label="套餐名称">
                      <Input value={tenant.packageName || ''} onChange={event => updateTenant(tenant.userId, { packageName: event.target.value })} />
                    </Field>
                    <Field label="状态">
                      <Input value={tenant.status} onChange={event => updateTenant(tenant.userId, { status: event.target.value as CustomerTenantPlan['status'] })} placeholder="active / trial / paused" />
                    </Field>
                    <Field label="AI Key 模式">
                      <Input value={tenant.aiMode || 'global'} onChange={event => updateTenant(tenant.userId, { aiMode: event.target.value as CustomerTenantPlan['aiMode'] })} placeholder="global / tenant" />
                    </Field>
                    <Field label="每日上限">
                      <Input type="number" min={1} value={tenant.dailyLimit} onChange={event => updateTenant(tenant.userId, { dailyLimit: Number(event.target.value) || 1 })} />
                    </Field>
                    <Field label="单轮上限">
                      <Input type="number" min={1} value={tenant.perRunLimit} onChange={event => updateTenant(tenant.userId, { perRunLimit: Number(event.target.value) || 1 })} />
                    </Field>
                    <Field label="席位数">
                      <Input type="number" min={1} value={tenant.maxSeats} onChange={event => updateTenant(tenant.userId, { maxSeats: Number(event.target.value) || 1 })} />
                    </Field>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm leading-6 text-slate-500">
                暂无客户空间。客户注册登录后会自动出现在这里。
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <RunbookCard title="客户登录后" text="后端使用 token.id 读写客户雷达和知识库，所以客户之间默认隔离。" />
          <RunbookCard title="管理台可控" text="管理员可以配置套餐状态、每日额度、单轮额度和席位数。" />
          <RunbookCard title="插件归客户" text="浏览器插件读取的是客户自己浏览器里的平台登录态，不共享平台账号。" />
        </section>
      </div>
    </main>
  )
}

function Field({ children, label }: { children: React.ReactNode, label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function StatusRow({ title, value }: { title: string, value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{value}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-slate-100">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function RunbookCard({ text, title }: { text: string, title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <FileText className="size-4 text-blue-600" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}
