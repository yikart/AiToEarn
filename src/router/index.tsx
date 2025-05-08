/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 15:58:37
 * @LastEditors: nevin
 * @Description:
 */
import {
  createHashRouter,
  IndexRouteObject,
  Navigate,
  NonIndexRouteObject,
} from 'react-router-dom';
import { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import {
  CopyOutlined,
  FireOutlined,
  UsergroupAddOutlined,
  ShopOutlined,
  MessageOutlined,
  AuditOutlined,
  OpenAIOutlined,
} from '@ant-design/icons';

// 组件
import { LayoutBody } from '@/layout/LayoutBody';

// 页面组件
import Login from '@/views/login';
import Trending from '@/views/trending';
import Account from '@/views/account';
import Publish from '@/views/publish/page';
import VideoPage from '@/views/publish/children/videoPage/page';
import ImagePage from '@/views/publish/children/imagePage/page';
import PubRecord from '@/views/publish/children/pubRecord/page';
import Statistics from '@/views/statistics/statistics';
import Task from '@/views/task/task';
import UserWalletAccount from '@/views/finance/userWalletAccount';
import Finance from '@/views/finance/finance';
import UserWalletRecord from '@/views/finance/userWalletRecord';
import Reply from '@/views/reply';
import Replyother from '@/views/replyother/replyother';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import AiTool from '@/views/aiTool/index';
import AiRanking from '../views/aiTool/children/aiRanking/index';
import AiToolWebview from '../views/aiTool/children/aiToolWebview';
import ExpectedIncome from '@/views/finance/expectedIncome';
// import Test from '@/views/test';

interface IRouterMeta {
  // 路由名称
  name?: string;
  // 路由icon
  icon?: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
}

interface ICustomRoute {
  meta?: IRouterMeta;
}

// 扩展原ts类型
interface ICustomIndexRouteObject extends IndexRouteObject {}
interface ICustomNonIndexRouteObject extends NonIndexRouteObject {
  children?: CustomRouteObject[];
}
type CustomRouteObject =
  | (ICustomIndexRouteObject & ICustomRoute)
  | (ICustomNonIndexRouteObject & ICustomRoute);

/**
 * 路由表
 * 只有 router[0] 才会被渲染到导航，所以请不要改动一级数据的顺序。
 * router[0].children 下的路由如果存在 meta 会渲染到 nav
 */
export const router: CustomRouteObject[] = [
  {
    element: (
      <ErrorBoundary>
        <LayoutBody />
      </ErrorBoundary>
    ),
    children: [
      // 重定向 ---------
      { path: '/publish', element: <Navigate to="/publish/video" /> },
      { path: '/aiTool', element: <Navigate to="/aiTool/aiRanking" /> },

      // 路由 ----------
      {
        path: '/',
        element: <Account />,
        meta: { name: '账户', icon: UsergroupAddOutlined },
      },
      {
        path: '/trending',
        element: <Trending />,
        meta: { name: '热门内容', icon: FireOutlined },
      },
      {
        path: '/publish',
        element: <Publish />,
        meta: { name: '一键发布', icon: CopyOutlined },
        children: [
          {
            path: 'video',
            element: <VideoPage />,
          },
          {
            path: 'image',
            element: <ImagePage />,
          },
          { path: 'pubRecord', element: <PubRecord /> },
        ],
      },
      {
        path: '/aiTool',
        element: <AiTool />,
        meta: { name: 'AI工具', icon: OpenAIOutlined },
        children: [
          {
            path: '/aiTool/aiRanking',
            element: <AiRanking />,
          },
          {
            path: '/aiTool/aiToolWebview',
            element: <AiToolWebview />,
          },
        ],
      },
      {
        path: '/reply',
        element: <Reply />,
        meta: { name: '评论管理', icon: MessageOutlined },
      },
      {
        path: '/Replyother',
        element: <Replyother />,
        meta: { name: 'AI评论截流', icon: MessageOutlined },
      },
      {
        path: '/statistics',
        element: <Statistics />,
        meta: { name: '数据中心', icon: AuditOutlined },
      },
      {
        path: '/task',
        element: <Task />,
        meta: { name: '任务市场', icon: ShopOutlined },
      },
      {
        path: '/finance',
        element: <Finance />,
        // meta: { name: '钱包', icon: MoneyCollectOutlined },
        children: [
          { path: 'userWalletRecord', element: <UserWalletRecord /> },
          { path: 'userWalletAccount', element: <UserWalletAccount /> },
          { path: 'expectedIncome', element: <ExpectedIncome /> },
        ],
      },
      // {
      //   path: '/test',
      //   element: <Test />,
      //   meta: { name: '测试', icon: ShopOutlined },
      // },
    ],
  },
  { path: '/login', element: <Login /> },
];

export default createHashRouter(router);
