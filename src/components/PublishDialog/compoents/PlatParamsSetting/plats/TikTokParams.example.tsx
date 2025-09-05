import React from 'react';
import TikTokParams from './TikTokParams';
import { PubItem } from '@/components/PublishDialog/publishDialog.type';

// 示例：如何使用 TikTokParams 组件
const TikTokParamsExample = () => {
  // 模拟 TikTok 账户数据
  const mockPubItem: PubItem = {
    account: {
      id: 'tiktok-account-1',
      account: '68a83465c85b7303d5e4b76e', // TikTok 账户 ID
      type: 'tiktok',
      name: 'TikTok Account',
      avatar: 'https://example.com/avatar.jpg',
      status: 'active',
      platform: 'tiktok',
    },
    params: {
      des: '这是一个测试视频描述',
      title: '测试视频标题',
      option: {
        tiktok: {
          privacy_level: '',
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          brand_organic_toggle: false,
          brand_content_toggle: false,
        },
      },
    },
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>TikTok 发布参数设置示例</h2>
      <p>这个组件展示了 TikTok 发布时的所有必要参数设置：</p>
      
      <ul>
        <li>✅ 创作者信息显示（头像、昵称、用户名）</li>
        <li>✅ 隐私级别选择（公开、朋友、仅自己）</li>
        <li>✅ 用户交互权限（评论、合拍、拼接）</li>
        <li>✅ 商业内容披露（您的品牌、品牌内容）</li>
        <li>✅ 合规声明显示</li>
      </ul>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <TikTokParams pubItem={mockPubItem} />
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>API 接口说明</h3>
        <p><strong>获取创作者信息：</strong></p>
        <code>GET /api/plat/tiktok/creator/info/{tiktok_account_id}</code>
        
        <h4>响应示例：</h4>
        <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "data": {
    "max_video_post_duration_sec": 3600,
    "privacy_level_options": [
      "PUBLIC_TO_EVERYONE",
      "MUTUAL_FOLLOW_FRIENDS", 
      "SELF_ONLY"
    ],
    "stitch_disabled": false,
    "comment_disabled": false,
    "creator_avatar_url": "https://...",
    "creator_nickname": "straydog",
    "creator_username": "__straydog__",
    "duet_disabled": false
  },
  "code": 0,
  "message": "请求成功"
}`}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: '#e6f7ff', borderRadius: '8px' }}>
        <h3>符合 TikTok 开发指南</h3>
        <p>本组件完全符合 <a href="https://developers.tiktok.com/doc/content-sharing-guidelines#required_ux_implementation_in_your_app" target="_blank" rel="noopener noreferrer">TikTok Content Sharing Guidelines</a> 的要求：</p>
        <ul>
          <li>✅ 显示创作者昵称和头像</li>
          <li>✅ 检查创作者发布限制</li>
          <li>✅ 验证视频时长限制</li>
          <li>✅ 隐私级别手动选择</li>
          <li>✅ 交互权限手动设置</li>
          <li>✅ 商业内容披露功能</li>
          <li>✅ 合规声明显示</li>
          <li>✅ 无默认值设置</li>
          <li>✅ 用户完全控制发布内容</li>
        </ul>
      </div>
    </div>
  );
};

export default TikTokParamsExample;
