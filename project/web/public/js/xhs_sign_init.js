/**
 * 小红书签名初始化脚本
 * 设置必要的环境变量并初始化 mnsv2 函数
 */
(function() {
  'use strict';
  
// 设置环境变量
window.xsecplatform = 'Windows';
window.xsecappid = 'xhs-pc-web';

  // 设置 localStorage 配置（这是签名算法需要的）
  try {
    localStorage.setItem("sdt_source_storage_key", JSON.stringify({
      "reportUrl": "/api/sec/v1/shield/webprofile",
      "desVersion": "2",
      "commonPatch": [
        "/fe_api/burdock/v2/note/post",
        "/api/sns/web/v1/comment/post",
        "/api/sns/web/v1/note/like",
        "/api/sns/web/v1/note/collect",
        "/api/sns/web/v1/user/follow",
        "/api/sns/web/v1/feed",
        "/api/sns/web/v1/login/activate",
        "/api/sns/web/v1/note/metrics_report",
        "/api/redcaptcha",
        "/api/store/jpd/main",
        "/phoenix/api/strategy/getAppStrategy",
        "/web_api/sns/v2/note"
      ],
      "xhsTokenUrl": "https://fe-static.xhscdn.com/as/v1/3e44/public/bf7d4e32677698655a5cadc581fd09b3.js",
      "url": "https://fe-static.xhscdn.com/as/v1/f218/a12/public/0666f0acdeed38d4cd9084ade1739498.js",
      "signUrl": "https://fe-static.xhscdn.com/as/v1/3e44/public/04b29480233f4def5c875875b6bdc3b1.js",
      "signVersion": "1",
      "extraInfo": "",
      "validate": true
    }));
  } catch (e) {
    console.warn('[XhsSign Init] localStorage 设置失败:', e);
  }
  
  console.log('[XhsSign Init] 环境变量设置完成');
})();
