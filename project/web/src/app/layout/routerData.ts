import type { MenuItemType } from 'antd/es/menu/interface'
import type { StaticImageData } from 'next/image'
import { directTrans } from '@/app/i18n/client'
import { useUserStore } from '@/store/user'

export interface IRouterDataItem {
  // 导航标题
  name: string
  // 翻译键
  translationKey: string
  // 跳转链接
  path?: string
  // icon
  icon?: StaticImageData
  // 导航背景颜色
  backColor?: string
  // 子导航
  children?: IRouterDataItem[]
}

export const routerData: IRouterDataItem[] = [
  // {
  //   name: "首页",
  //   translationKey: "home",
  //   path: "/",
  // },
  {
    name: '发布',
    translationKey: 'accounts',
    path: '/accounts',
  },
  {
    name: '互动数据',
    translationKey: 'interactive',
    path: '/interactive',
  },
  // {
  //   name: "热门内容",
  //   translationKey: "hotContent",
  //   path: "/hotContent",
  // },
  {
    name: 'AI工具',
    translationKey: 'aiTools',
    path: '/material/ai-generate',
  },
  {
    name: '任务中心',
    translationKey: 'tasks',
    path: '/tasks',
  },

  {
    name: '数据统计',
    translationKey: 'dataStatistics',
    path: '/dataStatistics',
  },

  {
    name: '素材库',
    translationKey: 'header.materialLibrary',
    path: '/material',
  },

  {
    name: '草稿箱',
    translationKey: 'header.draftBox',
    path: '/cgmaterial',
  },
]

function recursion(child: IRouterDataItem[] | undefined): MenuItemType[] | null {
  if (!child)
    return null
  return child.map((v) => {
    return {
      label: v.name,
      key: v.path || v.name,
      children: recursion(v.children),
    }
  })
}

export const peRouterData = recursion(routerData)

/**
 * 首页头部导航数据（根据语言动态生成）
 * - 英文语言跳转英文下载页：https://docs.aitoearn.ai/en/downloads
 * - 中文语言跳转中文下载页：https://docs.aitoearn.ai/zh/downloads
 */
export const homeHeaderRouterData = {
  get value() {
    const lang = useUserStore.getState().lang
    const downloadHref = lang === 'en'
      ? 'https://docs.aitoearn.ai/en/downloads'
      : 'https://docs.aitoearn.ai/zh/downloads'
    return [
      {
        href: '/',
        title: directTrans('home', 'header.nav.home'),
      },
      {
        href: '/pricing',
        title: directTrans('home', 'header.nav.pricing'),
      },
      {
        href: 'https://status.aitoearn.ai/',
        title: directTrans('home', 'header.nav.status'),
      },
      {
        href: 'https://docs.aitoearn.ai/',
        title: directTrans('home', 'header.nav.docs'),
      },
      {
        href: 'https://blog.aitoearn.ai/',
        title: directTrans('home', 'header.nav.blog'),
      },
      {
        href: downloadHref,
        title: directTrans('home', 'header.nav.download'),
      },
      {
        href: '/hotContent',
        title: directTrans('route', 'hotContent'),
      },
      {
        href: '/aiRank',
        title: directTrans('route', 'aiRank'),
      },
    ]
  },
}
