import React, { useState } from 'react';
import { Switch, Button } from 'antd';

// 简单的 Switch 测试组件
const TikTokSwitchDebug = () => {
  const [brandOrganicToggle, setBrandOrganicToggle] = useState(false);
  const [brandContentToggle, setBrandContentToggle] = useState(false);

  const isSwitchChecked = brandOrganicToggle || brandContentToggle;

  const handleSwitchChange = (checked: boolean) => {
    console.log('Switch changed to:', checked);
    if (!checked) {
      setBrandOrganicToggle(false);
      setBrandContentToggle(false);
    } else {
      setBrandOrganicToggle(true);
      setBrandContentToggle(false);
    }
  };

  const handleBrandOrganicChange = (checked: boolean) => {
    console.log('Brand organic changed to:', checked);
    setBrandOrganicToggle(checked);
  };

  const handleBrandContentChange = (checked: boolean) => {
    console.log('Brand content changed to:', checked);
    setBrandContentToggle(checked);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '20px' }}>
      <h3>TikTok Switch 调试</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p>当前状态：</p>
        <ul>
          <li>brand_organic_toggle: {brandOrganicToggle.toString()}</li>
          <li>brand_content_toggle: {brandContentToggle.toString()}</li>
          <li>Switch checked: {isSwitchChecked.toString()}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>商业内容披露开关：</label>
        <Switch
          checked={isSwitchChecked}
          onChange={handleSwitchChange}
        />
        <span style={{ marginLeft: '8px' }}>开启以披露此视频推广商品或服务以换取价值</span>
      </div>

      {isSwitchChecked && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <Switch
              checked={brandOrganicToggle}
              onChange={handleBrandOrganicChange}
            />
            <span style={{ marginLeft: '8px' }}>您的品牌</span>
          </div>
          <div>
            <Switch
              checked={brandContentToggle}
              onChange={handleBrandContentChange}
            />
            <span style={{ marginLeft: '8px' }}>品牌内容</span>
          </div>
        </div>
      )}

      <div>
        <Button 
          onClick={() => {
            setBrandOrganicToggle(false);
            setBrandContentToggle(false);
          }}
        >
          重置状态
        </Button>
      </div>
    </div>
  );
};

export default TikTokSwitchDebug;
