import React from 'react';
import PublishDialogPreview from './PublishDialogPreview';

// 示例：展示视频预览功能
const PublishDialogPreviewExample = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>作品预览组件示例</h2>
      <p>这个组件现在支持显示视频的详细信息：</p>
      
      <ul>
        <li>✅ <strong>文件名</strong> - 显示视频文件的原始文件名</li>
        <li>✅ <strong>格式</strong> - 自动从文件名提取并显示文件格式（如 MP4、MOV 等）</li>
        <li>✅ <strong>分辨率</strong> - 显示视频的宽度和高度（如 1920x1080）</li>
        <li>✅ <strong>文件大小</strong> - 自动格式化显示文件大小（如 1.5 MB、2.3 GB）</li>
        <li>✅ <strong>时长</strong> - 格式化显示视频时长（如 2:30、1:05:45）</li>
      </ul>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
        <h3>功能特点</h3>
        <ul>
          <li><strong>多语言支持</strong>：支持中英文标签显示</li>
          <li><strong>智能格式化</strong>：文件大小和时长自动格式化</li>
          <li><strong>响应式设计</strong>：适配不同屏幕尺寸</li>
          <li><strong>优雅的UI</strong>：半透明背景，清晰的标签和值显示</li>
        </ul>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
        <h3>数据来源</h3>
        <p>视频信息来自 <code>IVideoFile</code> 接口：</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`interface IVideoFile {
  filename: string;    // 文件名
  width: number;       // 视频宽度
  height: number;      // 视频高度
  size: number;        // 文件大小（字节）
  duration: number;    // 视频时长（秒）
  videoUrl: string;    // 视频URL
  cover: IImgFile;     // 封面图片
}`}
        </pre>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
        <h3>格式化示例</h3>
        <ul>
          <li><strong>文件大小</strong>：
            <ul>
              <li>1024 bytes → "1 KB"</li>
              <li>1048576 bytes → "1 MB"</li>
              <li>1073741824 bytes → "1 GB"</li>
            </ul>
          </li>
          <li><strong>时长</strong>：
            <ul>
              <li>65 seconds → "1:05"</li>
              <li>3665 seconds → "1:01:05"</li>
              <li>120 seconds → "2:00"</li>
            </ul>
          </li>
        </ul>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
        <h3>样式特点</h3>
        <ul>
          <li>半透明黑色背景 (rgba(0, 0, 0, 0.8))</li>
          <li>白色文字，标签为浅灰色</li>
          <li>圆角底部设计，与视频播放器完美融合</li>
          <li>响应式布局，标签和值左右对齐</li>
        </ul>
      </div>
    </div>
  );
};

export default PublishDialogPreviewExample;
