# WeChat Third-Party Platform Guide
1. Note: Because WeChat can only fill in one callback address, and there are restrictions such as domain name whitelist and IP address whitelist, the WeChat third-party service has been separated to serve multiple environments simultaneously.

2. WeChat third-party platform application: https://open.weixin.qq.com
    - Create application: Management Center > Third-Party Platform > Create Third-Party Platform
    - Fill in application information
    - Fill in development configuration
        - Authorization event receiving configuration: `https://{host}/wxPlat/callback/ticket` // Used to receive tickets
        - Message and event receiving configuration: `https://{host}/wxPlat/callback/msg/$APPID$` // Used to receive event messages
        - Authorization initiation page domain: `https://{host}` // Authorization page domain
    - Configuration file
        - Configuration file: `aitoearn-wxplat/config/local.config.js`
        - Configuration item: `wxPlat`
            `authBackHost`: Fill in your aitoearn-wxplat service domain
            `msgUrlList`: Domain list for forwarding messages to aitoearn-channel
            `authUrlMap`: Authorization callback addresses for different environments