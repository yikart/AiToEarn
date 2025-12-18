/**
 * SSE 消息处理测试页面
 * 功能：模拟 SSE 返回数据，测试消息处理和插件发布流程
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { useAgentStore } from '@/store/agent'
import { usePluginStore } from '@/store/plugin'
import { useAccountStore } from '@/store/account'
import { PluginStatus } from '@/store/plugin/types/baseTypes'
import type { PluginPlatformType } from '@/store/plugin/types/baseTypes'
import { useTransClient } from '@/app/i18n/client'
import type { ISSEMessage } from '@/store/agent/agent.types'

// 完整的 SSE 返回数据
const SSE_RESULT_DATA: ISSEMessage = {
  type: 'result',
  message: {
    type: 'result',
    subtype: 'success',
    uuid: 'f71410ec-3b27-45a7-9241-128f818aaf1b',
    duration_ms: 186431,
    duration_api_ms: 121959,
    is_error: false,
    num_turns: 16,
    message: `完成！已成功为您处理红色风格图片并发布到三个平台：

✅ **推特（Twitter）**：已成功发布
- 内容：🔴 Red Vibes Only! Embracing the power and passion of red aesthetics ❤️
- 标签：#RedAesthetic #VibrantVibes #ColorPop #ArtisticVision

📱 **抖音**：内容已准备好，请前往发布页面手动发布
- 标题：红色美学｜热情活力的视觉盛宴
- 话题：#红色美学 #色彩艺术 #视觉设计 #摄影调色 #艺术分享

📱 **小红书**：内容已准备好，请前往发布页面手动发布
- 标题：🔴红色美学｜热情活力的视觉盛宴
- 话题：#红色美学 #色彩艺术 #摄影调色 #视觉设计 #艺术分享

由于抖音和小红书平台暂不支持自动发布，系统已为您准备好内容和图片，您可以前往对应平台的发布页面完成发布操作。`,
    result: [
      {
        type: 'fullContent',
        title: '🔴 Red Vibes Only! Embracing the power and passion of red aesthetics ❤️',
        description:
          '🔴 Red Vibes Only! Embracing the power and passion of red aesthetics ❤️ #RedAesthetic #VibrantVibes #ColorPop #ArtisticVision',
        tags: [],
        medias: [
          {
            type: 'IMAGE',
            url: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/68abbe6af812ccb3e1a53d68/mj9tg7gz.png',
          },
        ],
        action: 'none',
        platform: 'twitter',
      },
      {
        type: 'fullContent',
        title: '红色美学｜热情活力的视觉盛宴',
        description:
          '🔴 红色美学来袭！感受红色带来的热情与力量，每一帧都充满艺术感染力。这组红色调色让整个画面都充满了温暖和活力✨ 你喜欢这种红色风格吗？',
        tags: ['红色美学', '色彩艺术', '视觉设计', '摄影调色', '艺术分享'],
        medias: [
          {
            type: 'IMAGE',
            url: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/68abbe6af812ccb3e1a53d68/mj9tg7gz.png',
          },
        ],
        action: 'navigateToPublish',
        platform: 'douyin',
        accountId: 'douyin_MS4wLjABAAAATHE9sjNjL2xUmIvoGev3Q1wNVZCAsEzwX06VlzyCZztj0jBV-dMdN6cETZghdV3y_web',
        errorMessage: '抖音平台发布工具暂不支持，请前往发布页面手动发布',
      },
      {
        type: 'fullContent',
        title: '🔴红色美学｜热情活力的视觉盛宴',
        description: `🔴 红色美学来袭！

感受红色带来的热情与力量，每一帧都充满艺术感染力💫

这组红色调色让整个画面都充满了温暖和活力，红色不仅是一种颜色，更是一种态度和表达✨

你最喜欢哪种风格的调色呢？评论区告诉我～`,
        tags: ['红色美学', '色彩艺术', '摄影调色', '视觉设计', '艺术分享'],
        medias: [
          {
            type: 'IMAGE',
            url: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/68abbe6af812ccb3e1a53d68/mj9tg7gz.png',
          },
        ],
        action: 'navigateToPublish',
        platform: 'xhs',
        accountId: 'xhs_681b9361000000000801588b_web',
        errorMessage: '小红书平台发布工具暂不支持，请前往发布页面手动发布',
      },
    ],
    total_cost_usd: 1.26249485,
    usage: {
      cache_creation: {
        ephemeral_1h_input_tokens: 0,
        ephemeral_5m_input_tokens: 299859,
      },
      cache_creation_input_tokens: 299859,
      cache_read_input_tokens: 246602,
      input_tokens: 75,
      output_tokens: 3697,
      server_tool_use: {
        web_search_requests: 0,
      },
    },
    permission_denials: [],
  },
}

// 只测试小红书的数据
const XHS_ONLY_RESULT: ISSEMessage = {
  type: 'result',
  message: {
    type: 'result',
    subtype: 'success',
    uuid: 'test-xhs-only',
    message: '小红书发布测试',
    result: [
      {
        type: 'fullContent',
        title: '🔴红色美学｜热情活力的视觉盛宴',
        description: `🔴 红色美学来袭！

感受红色带来的热情与力量，每一帧都充满艺术感染力💫

这组红色调色让整个画面都充满了温暖和活力，红色不仅是一种颜色，更是一种态度和表达✨

你最喜欢哪种风格的调色呢？评论区告诉我～`,
        tags: ['红色美学', '色彩艺术', '摄影调色', '视觉设计', '艺术分享'],
        medias: [
          {
            type: 'IMAGE',
            url: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/68abbe6af812ccb3e1a53d68/mj9tg7gz.png',
          },
        ],
        action: 'navigateToPublish',
        platform: 'xhs',
        accountId: 'xhs_681b9361000000000801588b_web',
      },
    ],
    total_cost_usd: 0.5,
  },
}

// 只测试抖音的数据
const DOUYIN_ONLY_RESULT: ISSEMessage = {
  type: 'result',
  message: {
    type: 'result',
    subtype: 'success',
    uuid: 'test-douyin-only',
    message: '抖音发布测试',
    result: [
      {
        type: 'fullContent',
        title: '红色美学｜热情活力的视觉盛宴',
        description:
          '🔴 红色美学来袭！感受红色带来的热情与力量，每一帧都充满艺术感染力。这组红色调色让整个画面都充满了温暖和活力✨ 你喜欢这种红色风格吗？',
        tags: ['红色美学', '色彩艺术', '视觉设计', '摄影调色', '艺术分享'],
        medias: [
          {
            type: 'IMAGE',
            url: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com/ai/images/gemini-3-pro-image-preview/68abbe6af812ccb3e1a53d68/mj9tg7gz.png',
          },
        ],
        action: 'navigateToPublish',
        platform: 'douyin',
        accountId: 'douyin_MS4wLjABAAAATHE9sjNjL2xUmIvoGev3Q1wNVZCAsEzwX06VlzyCZztj0jBV-dMdN6cETZghdV3y_web',
      },
    ],
    total_cost_usd: 0.5,
  },
}

export default function SSEMessageTestPage() {
  const router = useRouter()
  const { lng } = useParams()
  const { t } = useTransClient('chat')

  // Agent Store
  const { handleSSEMessage, handleResult, setActionContext, getActionContext } = useAgentStore(
    useShallow((state) => ({
      handleSSEMessage: state.handleSSEMessage,
      handleResult: state.handleResult,
      setActionContext: state.setActionContext,
      getActionContext: state.getActionContext,
    })),
  )

  // Agent 状态
  const { isGenerating, progress, currentCost, messages } = useAgentStore(
    useShallow((state) => ({
      isGenerating: state.isGenerating,
      progress: state.progress,
      currentCost: state.currentCost,
      messages: state.messages,
    })),
  )

  // 插件状态
  const { status: pluginStatus, isPublishing, platformAccounts } = usePluginStore(
    useShallow((state) => ({
      status: state.status,
      isPublishing: state.isPublishing,
      platformAccounts: state.platformAccounts,
    })),
  )

  // 账号列表
  const { accountGroupList } = useAccountStore(
    useShallow((state) => ({
      accountGroupList: state.accountGroupList,
    })),
  )

  // 日志
  const [logs, setLogs] = useState<string[]>([])
  // 选择的测试数据
  const [selectedTest, setSelectedTest] = useState<'all' | 'xhs' | 'douyin'>('xhs')
  // Action Context 是否已设置
  const [isContextSet, setIsContextSet] = useState(false)

  // 添加日志
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }, [])

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // 设置 Action 上下文（组件挂载时）
  useEffect(() => {
    addLog('🔧 设置 Action 上下文...')
    setActionContext({
      router,
      lng: lng as string,
      t: t as any,
    })
    setIsContextSet(true)
    addLog('✅ Action 上下文已设置')

    // 检查当前上下文
    const ctx = getActionContext()
    addLog(`📋 当前上下文: ${ctx ? 'OK' : 'NULL'}`)
  }, [router, lng, t, setActionContext, getActionContext, addLog])

  // 获取所有账号
  const allAccounts = accountGroupList.reduce<any[]>((acc, group) => {
    return [...acc, ...group.children]
  }, [])

  // 获取测试数据
  const getTestData = (): ISSEMessage => {
    switch (selectedTest) {
      case 'xhs':
        return XHS_ONLY_RESULT
      case 'douyin':
        return DOUYIN_ONLY_RESULT
      default:
        return SSE_RESULT_DATA
    }
  }

  // 测试 handleSSEMessage
  const handleTestSSEMessage = () => {
    const testData = getTestData()
    addLog(`🚀 开始测试 handleSSEMessage (${selectedTest})...`)
    addLog(`📦 消息类型: ${testData.type}`)
    addLog(`📋 结果数量: ${testData.message?.result?.length || 0}`)

    // 检查 Action 上下文
    const ctx = getActionContext()
    if (!ctx) {
      addLog('❌ Action 上下文未设置！')
      return
    }
    addLog('✅ Action 上下文已就绪')

    try {
      // 调用 handleSSEMessage
      handleSSEMessage(testData)
      addLog('✅ handleSSEMessage 调用完成')
    } catch (error: any) {
      addLog(`❌ handleSSEMessage 错误: ${error.message}`)
    }
  }

  // 测试 handleResult (直接调用)
  const handleTestResult = () => {
    const testData = getTestData()
    addLog(`🚀 开始测试 handleResult (${selectedTest})...`)

    // 检查 Action 上下文
    const ctx = getActionContext()
    if (!ctx) {
      addLog('❌ Action 上下文未设置！请先点击"设置 Action 上下文"')
      return
    }
    addLog('✅ Action 上下文已就绪')
    addLog(`📋 router: ${ctx.router ? 'OK' : 'NULL'}`)
    addLog(`📋 lng: ${ctx.lng}`)
    addLog(`📋 t: ${typeof ctx.t === 'function' ? 'OK' : 'NULL'}`)

    const resultMsg = testData.message
    addLog(`📦 结果消息: ${resultMsg?.message?.substring(0, 50)}...`)
    addLog(`📋 result 数组: ${resultMsg?.result?.length || 0} 个`)

    if (resultMsg?.result) {
      resultMsg.result.forEach((item: any, index: number) => {
        addLog(`  [${index}] platform: ${item.platform}, action: ${item.action}, type: ${item.type}`)
      })
    }

    try {
      // 直接调用 handleResult
      handleResult(resultMsg)
      addLog('✅ handleResult 调用完成')
    } catch (error: any) {
      addLog(`❌ handleResult 错误: ${error.message}`)
      console.error(error)
    }
  }

  // 手动重新设置 Action 上下文
  const handleSetContext = () => {
    addLog('🔧 手动设置 Action 上下文...')
    setActionContext({
      router,
      lng: lng as string,
      t: t as any,
    })
    addLog('✅ Action 上下文已设置')

    const ctx = getActionContext()
    addLog(`📋 验证上下文: ${ctx ? 'OK' : 'NULL'}`)
  }

  // 刷新插件状态
  const handleRefreshPlugin = async () => {
    addLog('🔄 刷新插件状态...')
    await usePluginStore.getState().init()
    addLog(`✅ 插件状态: ${usePluginStore.getState().status}`)
  }

  // 登录平台
  const handleLogin = async (platform: PluginPlatformType) => {
    addLog(`🔑 登录 ${platform}...`)
    try {
      const result = await usePluginStore.getState().login(platform)
      addLog(`✅ 登录成功: ${result.nickname} (${result.uid})`)
      await usePluginStore.getState().syncAccountToDatabase(platform)
      addLog('✅ 账号已同步')
    } catch (error: any) {
      addLog(`❌ 登录失败: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          🧪 SSE 消息处理测试
        </h1>

        {/* 状态面板 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Agent 状态 */}
          <div className="bg-card rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">📊 Agent 状态</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">生成中:</span>
                <span className={isGenerating ? 'text-warning' : 'text-muted-foreground'}>
                  {isGenerating ? '是' : '否'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">进度:</span>
                <span>{progress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">消费:</span>
                <span>${currentCost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">消息数:</span>
                <span>{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action 上下文:</span>
                <span className={isContextSet ? 'text-success' : 'text-destructive'}>
                  {isContextSet ? '已设置' : '未设置'}
                </span>
              </div>
            </div>
          </div>

          {/* 插件状态 */}
          <div className="bg-card rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">🔌 插件状态</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">插件状态:</span>
                <span
                  className={
                    pluginStatus === PluginStatus.READY
                      ? 'text-success'
                      : pluginStatus === PluginStatus.NOT_INSTALLED
                        ? 'text-destructive'
                        : 'text-warning'
                  }
                >
                  {pluginStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">发布中:</span>
                <span>{isPublishing ? '是' : '否'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">小红书:</span>
                <span>{platformAccounts.xhs?.nickname || '未登录'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">抖音:</span>
                <span>{platformAccounts.douyin?.nickname || '未登录'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">账号总数:</span>
                <span>{allAccounts.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 测试数据选择 */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">📝 测试数据选择</h2>
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedTest === 'xhs' ? 'default' : 'outline'}
              onClick={() => setSelectedTest('xhs')}
            >
              仅小红书
            </Button>
            <Button
              variant={selectedTest === 'douyin' ? 'default' : 'outline'}
              onClick={() => setSelectedTest('douyin')}
            >
              仅抖音
            </Button>
            <Button
              variant={selectedTest === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedTest('all')}
            >
              全部平台
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            当前选择: <span className="font-medium text-foreground">{selectedTest}</span>
            {' | '}
            结果数量: <span className="font-medium text-foreground">{getTestData().message?.result?.length || 0}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">🎮 操作</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSetContext} variant="outline">
              🔧 设置 Action 上下文
            </Button>
            <Button onClick={handleRefreshPlugin} variant="outline">
              🔄 刷新插件状态
            </Button>
            <Button onClick={() => handleLogin('xhs' as PluginPlatformType)} variant="outline">
              🔑 登录小红书
            </Button>
            <Button onClick={() => handleLogin('douyin' as PluginPlatformType)} variant="outline">
              🔑 登录抖音
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
            <Button
              onClick={handleTestSSEMessage}
              disabled={!isContextSet}
              className="bg-info hover:bg-info/90"
            >
              📨 测试 handleSSEMessage
            </Button>
            <Button
              onClick={handleTestResult}
              disabled={!isContextSet}
              className="bg-destructive hover:bg-destructive/90"
            >
              🚀 测试 handleResult (直接调用)
            </Button>
            <Button onClick={clearLogs} variant="ghost">
              🗑️ 清空日志
            </Button>
          </div>
        </div>

        {/* 测试数据预览 */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">📋 测试数据预览</h2>
          <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto max-h-48">
            <pre>{JSON.stringify(getTestData().message?.result, null, 2)}</pre>
          </div>
        </div>

        {/* 日志输出 */}
        <div className="bg-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">📋 日志输出</h2>
          <div className="bg-zinc-900 text-success p-4 rounded font-mono text-xs h-80 overflow-auto dark:bg-zinc-950">
            {logs.length === 0 ? (
              <p className="text-zinc-500">等待操作...</p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="mb-1">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 text-sm text-muted-foreground">
          <h3 className="font-semibold mb-2">📖 使用说明:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>页面加载后会自动设置 Action 上下文（router, lng, t）</li>
            <li>确保插件状态为 READY（如果需要测试发布功能）</li>
            <li>选择要测试的平台（小红书/抖音/全部）</li>
            <li>
              点击「测试 handleSSEMessage」模拟完整 SSE 消息处理流程
            </li>
            <li>
              或点击「测试 handleResult」直接调用结果处理（跳过 SSE 解析）
            </li>
            <li>观察日志和控制台输出</li>
          </ol>
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded">
            <p className="text-warning-foreground">
              <strong>关键点：</strong> handleResult 需要 actionContext 才能执行 ActionRegistry.executeBatch。
              本页面会在挂载时自动设置上下文，也可以手动点击「设置 Action 上下文」按钮。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
