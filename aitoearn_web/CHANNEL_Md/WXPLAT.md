# 微信三方平台 指南
1. 注意：因为微信只能填写一个回调地址，以及有域名白名单，ip地址白名单等限制，所以把微信第三方单独抽离做了一个服务，该服务同时服务多个环境

2. 微信三方平台申请：https://open.weixin.qq.com
    - 创建应用：管理中心>第三方平台>创建第三方平台
    - 填写应用信息
    - 填写开发配置
        - 授权事件接收配置：`https://{host}/wxPlat/callback/ticket` // 用于接收票据
        - 消息与事件接收配置`https://{host}/wxPlat/callback/msg/$APPID$` // 用于接收事件消息
        - 授权发起页域名`https://{host}` // 授权页面域名
    - 配置文件
        - 配置文件：`aitoearn-wxplat/config/local.config.js`
        - 配置项：`wxPlat`
            其中`authBackHost` 填写你的aitoearn-wxplat服务域名
            `msgUrlList` 转发给aitoearn-channel的消息的域名列表
            `authUrlMap` 不同环境的授权回调地址
