/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-22 18:22:15
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
  // HomeOutlined,
  // InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';

// 组件
import { LayoutBody } from '@/layout/LayoutBody';

// 页面组件
import Login from '@/views/login';
import Trending from '@/views/trending';
// import About from '@/views/about/About';
import Account from '@/views/account';
import Publish from '@/views/publish/page';
import VideoPage from '@/views/publish/children/videoPage/page';
import PubRecord from '@/views/publish/children/pubRecord/page';
import Drafts from '@/views/publish/children/drafts/page';
import Shipinhao from '@/views/test/shipinhao';
import Douyin from '@/views/test/douyin/index';
import Douyin2 from '@/views/test/douyin2';
import Xiaohongshu from '@/views/test/xiaohongshu';
import Statistics from '@/views/statistics';
import Test from '@/views/test/index';
import TestVideo from '@/views/test/video';
import Task from '@/views/task';

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
    element: <LayoutBody />,
    children: [
      // 重定向 ---------
      {
        path: '/publish',
        element: <Navigate to="/publish/video" />,
      },

      // 路由 ----------
      {
        path: '/',
        element: <Account />,
        meta: {
          name: '账户',
          icon: UserOutlined,
        },
      },
      {
        path: '/trending',
        element: <Trending />,
        meta: {
          name: '热门内容',
          icon: FireOutlined,
        },
      },
      // {
      //   path: '/about',
      //   element: <About />,
      //   meta: {
      //     name: '关于',
      //     icon: InfoCircleOutlined,
      //   },
      // },
      {
        path: '/publish',
        element: <Publish />,
        meta: {
          name: '一键发布',
          icon: CopyOutlined,
        },
        children: [
          {
            path: 'video',
            element: <VideoPage />,
          },
          // {
          //   path: 'image',
          //   element: <ImagePage />,
          // },
          // {
          //   path: 'text',
          //   element: <TextPage />,
          // },
          {
            path: 'pubRecord',
            element: <PubRecord />,
          },
          {
            path: 'drafts',
            element: <Drafts />,
          },
        ],
      },
      {
        path: '/statistics',
        element: <Statistics />,
        meta: {
          name: '数据中心',
          icon: UserOutlined,
        },
      },
      {
        path: '/task',
        element: <Task />,
        meta: {
          name: '任务市场',
          icon: UserOutlined,
        },
      },
      {
        path: '/ceshi',
        element: <Test />,
        meta: {
          name: '测试',
          icon: UserOutlined,
        },
        children: [
          {
            path: 'video',
            element: <TestVideo />,
          },
          {
            path: 'douyin',
            element: <Douyin />,
          },
          {
            path: 'douyin2',
            element: <Douyin2 />,
          },
          {
            path: 'shipinhao',
            element: <Shipinhao />,
          },
          {
            path: 'xiaohongshu',
            element: <Xiaohongshu />,
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
];

export default createHashRouter(router);
