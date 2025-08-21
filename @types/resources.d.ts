interface Resources {
  "account": {
    "title": "账户",
    "describe": "账户页面",
    "today": "今天",
    "defaultSpace": "defaultSpace",
    "addPost": "添加帖子",
    "calendarMode": "日历模式",
    "listModeTab": "列表模式",
    "newWork": "新建作品",
    "allPlatforms": "所有平台",
    "accountManager": "账号管理器",
    "addAccount": "添加账号",
    "mcpManager": "MCP 管理器",
    "online": "在线",
    "offline": "离线",
    "checkLoginStatus": "登录状态检测",
    "checkAllLoginStatus": "一键检测登录状态",
    "nickname": "昵称",
    "platform": "平台",
    "loginStatus": "登录状态",
    "accountStatus": "账号状态",
    "normal": "正常",
    "disabled": "禁用",
    "unknownPlatform": "未知平台",
    "unknownAccount": "未知账户",
    "addAccountModal": {
      "title": "账号添加",
      "subtitle": "选择平台添加账号"
    },
    "facebookPages": {
      "title": "选择Facebook页面",
      "selectAll": "全选",
      "cancel": "取消",
      "confirm": "确认选择",
      "loading": "加载中...",
      "noPages": "暂无可用页面",
      "fetchError": "获取页面列表失败",
      "submitError": "页面选择失败",
      "submitSuccess": "页面选择成功",
      "selectAtLeastOne": "请至少选择一个页面"
    },
    "listMode": {
      "title": "发布计划列表",
      "recordCount": "共 {{count}} 条发布计划",
      "newWork": "新建作品",
      "noRecords": "暂无发布计划"
    },
    "chooseSpace": "选择空间",
    "pleaseChooseSpace": "请选择空间",
    "accountAddedToSpace": "账号已添加到空间",
    "noNewAccountDetected": "未检测到新账号，稍后可在账号管理器中手动调整空间",
    "ipInfo": {
      "loading": "获取IP信息中...",
      "error": "IP信息获取失败",
      "tooltip": "ASN: {{asn}}\n组织: {{org}}"
    }
  },
  "cgmaterial": {
    "header": {
      "title": "AI草稿箱",
      "importContent": "导入发布内容",
      "createGroup": "新建草稿箱组"
    },
    "sidebar": {
      "noGroups": "暂无草稿箱组",
      "noGroupsDesc": "创建您的第一个草稿箱组开始整理素材",
      "selectGroup": "请选择草稿箱组",
      "selectGroupDesc": "从左侧选择一个草稿箱组来查看其中的素材",
      "edit": "编辑",
      "delete": "删除",
      "deleteConfirm": "删除草稿组",
      "deleteConfirmDesc": "确定要删除\"{{name}}\"吗？",
      "deleteSuccess": "删除成功",
      "deleteFailed": "删除失败",
      "updateSuccess": "更新成功",
      "updateFailed": "更新失败",
      "noDesc": "暂无描述"
    },
    "content": {
      "noMaterials": "暂无草稿素材",
      "noMaterialsDesc": "创建您的第一个素材或批量生成草稿",
      "createMaterial": "创建素材",
      "batchGenerate": "批量生成草稿",
      "edit": "编辑",
      "generating": "生成中",
      "completed": "已生成"
    },
    "createGroup": {
      "title": "新建草稿箱组",
      "name": "组名称",
      "namePlaceholder": "请输入草稿箱组名称",
      "type": "类型",
      "typePlaceholder": "请选择草稿类型",
      "imageText": "图文草稿",
      "video": "视频草稿",
      "desc": "描述",
      "descPlaceholder": "请输入草稿箱组描述（可选）",
      "createSuccess": "创建草稿箱组成功",
      "createFailed": "创建草稿箱组失败",
      "getGroupsFailed": "获取草稿箱组失败",
      "getMaterialsFailed": "获取草稿素材失败"
    },
    "createMaterial": {
      "title": "创建素材",
      "selectCoverGroup": "选择封面组（图片组）",
      "selectCoverGroupDesc": "选择一个图片组作为封面来源",
      "selectVideoGroup": "选择视频组",
      "selectVideoGroupDesc": "选择一个视频组作为视频素材来源",
      "selectCover": "选择封面（图片，单选）",
      "selectVideo": "选择视频素材（单选）",
      "reselectCoverGroup": "重新选择封面组",
      "reselectVideoGroup": "重新选择视频组",
      "coverMustBeImage": "封面必须是图片",
      "imageGroupOnly": "图文组不能选择视频素材",
      "videoGroupOnly": "视频组只能选择视频素材",
      "selectMediaGroup": "请选择媒体组",
      "selectCoverAndMaterials": "请完整选择封面和素材",
      "selectCoverGroupRequired": "请选择封面组（图片组）",
      "selectVideoGroupRequired": "请选择视频组",
      "selectCoverRequired": "请选择封面（图片）",
      "selectVideoRequired": "请选择视频素材",
      "createSuccess": "创建素材成功",
      "createFailed": "创建素材失败"
    },
    "batchGenerate": {
      "title": "批量生成草稿",
      "model": "大模型",
      "modelPlaceholder": "请选择大模型",
      "prompt": "提示词",
      "promptPlaceholder": "请输入提示词",
      "titlePlaceholder": "请输入标题",
      "descPlaceholder": "请输入简介",
      "coverGroup": "封面组",
      "coverGroupPlaceholder": "请选择封面组",
      "mediaGroups": "素材组",
      "mediaGroupsPlaceholder": "请选择素材组",
      "num": "生成数量",
      "location": "地理位置",
      "preview": "预览",
      "startTask": "开始任务",
      "cancel": "取消",
      "taskStarted": "批量生成任务已启动",
      "generateFailed": "批量生成草稿失败",
      "previewFailed": "获取预览失败",
      "noPreview": "暂无预览内容"
    },
    "import": {
      "title": "导入已有发布内容",
      "selectAccount": "选择账户",
      "publishContent": "的发布内容 (选择要导入的内容)",
      "importSelected": "导入选中内容",
      "selectToImport": "请选择要导入的发布内容",
      "selectGroupFirst": "请先选择草稿箱组",
      "importSuccess": "成功导入 {{count}} 条内容到草稿箱",
      "importFailed": "导入失败",
      "getAccountsFailed": "获取账户列表失败",
      "getPublishListFailed": "获取发布列表失败"
    },
    "detail": {
      "title": "素材详情",
      "titleLabel": "标题：",
      "descLabel": "简介：",
      "typeLabel": "类型：",
      "coverLabel": "封面：",
      "materialsLabel": "素材内容：",
      "statusLabel": "状态：",
      "noMaterials": "暂无素材内容"
    },
    "editGroup": {
      "title": "编辑草稿箱组",
      "namePlaceholder": "请输入新组名",
      "enterName": "请输入新组名"
    },
    "editMaterial": {
      "title": "编辑素材",
      "updateSuccess": "更新素材成功",
      "updateFailed": "更新素材失败"
    },
    "mediaGroupType": {
      "img": "图片组",
      "video": "视频组",
      "mixed": "混合组"
    },
    "selectCover": "选择封面（单选）",
    "selectMaterials": "选择素材（多选）",
    "title": "标题",
    "description": "简介",
    "location": "地理位置",
    "mediaCount": "个资源",
    "pleaseCompleteForm": "请完善表单信息"
  },
  "common": {
    "profile": "个人中心",
    "logout": "退出登录",
    "unknownUser": "未知用户",
    "login": "登录",
    "notifications": "消息通知",
    "noNotifications": "暂无消息",
    "markAllAsRead": "全部标记为已读",
    "markAsRead": "标记为已读",
    "unreadCount": "未读消息",
    "viewAll": "查看全部",
    "actions": {
      "cancel": "取消",
      "confirm": "确认",
      "selectAll": "全选",
      "loading": "加载中...",
      "noData": "暂无数据",
      "noImage": "暂无图片",
      "noDescription": "暂无描述",
      "noContent": "暂无内容"
    },
    "notificationTypes": {
      "system": "系统通知",
      "user": "用户通知",
      "material": "素材通知",
      "other": "其他通知"
    },
    "header": {
      "messages": "消息通知",
      "materialLibrary": "素材库",
      "draftBox": "草稿箱"
    },
    "websit": {
      "termsOfService": {
        "title": "用户协议",
        "lastUpdated": "最后更新时间",
        "content": {
          "introduction": "欢迎使用我们的服务。在使用本服务前，请仔细阅读以下条款和条件。",
          "acceptance": "1. 接受条款",
          "acceptanceContent": "通过访问和使用本服务，您同意受本用户协议的约束。如果您不同意这些条款，请不要使用本服务。",
          "serviceDescription": "2. 服务说明",
          "serviceDescriptionContent": "本服务是一个AI内容创作平台，帮助用户生成和管理多媒体内容。",
          "userResponsibilities": "3. 用户责任",
          "userResponsibilitiesContent": "用户应确保其使用本服务的行为符合当地法律法规，不得用于非法目的。",
          "privacy": "4. 隐私保护",
          "privacyContent": "我们重视您的隐私，详细信息请参阅我们的隐私政策。",
          "termination": "5. 服务终止",
          "terminationContent": "我们保留在任何时候终止或暂停服务的权利。",
          "contact": "6. 联系我们",
          "contactContent": "如有任何问题，请通过邮件联系我们：support@example.com"
        }
      },
      "privacyPolicy": {
        "title": "隐私政策",
        "lastUpdated": "最后更新时间",
        "content": {
          "introduction": "本隐私政策说明我们如何收集、使用和保护您的个人信息。",
          "informationCollection": "1. 信息收集",
          "informationCollectionContent": "我们收集您主动提供的信息以及您使用服务时自动收集的信息。",
          "informationUse": "2. 信息使用",
          "informationUseContent": "我们使用收集的信息来提供、维护和改进我们的服务。",
          "informationSharing": "3. 信息共享",
          "informationSharingContent": "我们不会向第三方出售、交易或转让您的个人信息。",
          "dataSecurity": "4. 数据安全",
          "dataSecurityContent": "我们采用适当的安全措施来保护您的个人信息。",
          "userRights": "5. 用户权利",
          "userRightsContent": "您有权访问、更正或删除您的个人信息。",
          "contact": "6. 联系我们",
          "contactContent": "如有隐私相关问题，请联系我们：privacy@example.com"
        }
      },
      "dataDeletion": {
        "title": "申请删除数据",
        "subtitle": "如果您希望删除您的个人数据，请按照以下步骤操作",
        "lastUpdated": "最后更新时间",
        "prelaunchNote": "对于预发布用户：",
        "prelaunchContent": "我们目前处于预发布阶段，如需删除数据，请直接联系我们的支持团队。",
        "standardProcedure": "标准删除流程：",
        "steps": [
          "登录您的账户并进入设置页面",
          "点击「数据管理」选项",
          "选择「删除我的数据」",
          "确认删除操作并等待处理完成"
        ],
        "contactInfo": "联系方式：",
        "contactEmail": "如需帮助，请发送邮件至：datadeletion@example.com",
        "processingTime": "处理时间：",
        "processingTimeContent": "数据删除请求通常在 7-14 个工作日内处理完成。",
        "importantNote": "重要提示：",
        "importantNoteContent": "数据删除后无法恢复，请谨慎操作。某些法律要求保留的数据可能无法删除。"
      }
    }
  },
  "demo": {
    "demoText": "测试文字",
    "title": "测试页面标题"
  },
  "home": {
    "releaseBanner": {
      "tag": "Release v0.8.0",
      "text": "通过插件和繁荣的市场构建和扩展AI工作流程。"
    },
    "header": {
      "logo": "Aitorarn",
      "nav": {
        "marketplace": "市场",
        "pricing": "价格",
        "status": "状态",
        "docs": "问题",
        "blog": "博客"
      },
      "getStarted": "立即开始"
    },
    "hero": {
      "stars": "105.2k",
      "starsText": "stars on",
      "github": "GitHub",
      "title": "成为最好用的内容营销\nAI Agent",
      "subtitle": "从今天起，使用AI轻松管理你的社交媒体。AITOEARN提供从灵感创意、内容制作，内容分发内容互动管理等一站式能力，让AI触手可及。",
      "getStarted": "立即开始"
    },
    "brandBar": {
      "title": "支持的社交媒体平台"
    },
    "buildSection": {
      "badge": "灵感创意",
      "title": "灵感枯竭?",
      "titleBlue": "来看看全网有哪些热点吧",
      "features": {
        "hotTopic": {
          "title": "AI热点抓取，全网热点一网打尽",
          "description": "通过AI抓取全网热点，AI分析一键生成同款爆款内容,热点流量一网打尽"
        },
        "international": {
          "title": "国际站：YouTube 、 TikTok 、 Facebook 、 Instagram 、 LinkedIn 、 X (Twitter) 、 Rednote",
          "description": "海外站热点抓取，让你第一时间了解最新动态"
        },
        "domestic": {
          "title": "国内站：抖音 、 快手 、 微信 、 Bilibili",
          "description": "支持国内站的热点抓取，让你不错过每一条热点流量"
        }
      },
      "carouselHint": "使用滚轮切换图片"
    },
    "connectSection": {
      "badge": "功能介绍",
      "title": "自媒体运营平台一站式解决方案",
      "titleBlue": "从灵感创意到内容制作，从内容分发到内容互动管理",
      "features": {
        "creation": {
          "title": "内容创作",
          "description": "AI内容创作，AI图片生成，图文创作等AI能力，让你的内容更加生动有趣"
        },
        "distribution": {
          "title": "内容分发",
          "description": "支持国内外多平台分发，让你的内容触达更多用户，一键式管理，让你的内容触达更多用户"
        },
        "interaction": {
          "title": "内容互动管理",
          "description": "支持国内外多平台互动管理，让你的内容互动更加高效，一键式管理，让你的内容互动更加高效"
        },
        "analytics": {
          "title": "数据分析",
          "description": "支持国内外多平台数据分析，让你的数据分析更加高效，一键式管理，让你的数据分析更加高效"
        }
      },
      "carouselHint": "使用滚轮切换图片"
    },
    "downloadSection": {
      "title": "随时随地开始创作",
      "titleBlue": "移动端也能轻松管理",
      "description": "借助 AI ToEarn 移动应用，您的创作不再局限于桌面端。我们还为您提供 iOS 和 Android 移动应用，随时随地释放您的创造力，仅需一部手机即可！",
      "appStore": {
        "text": "Download on the",
        "store": "App Store"
      },
      "googlePlay": {
        "text": "GET IT ON",
        "store": "Google Play"
      }
    },
    "enterpriseSection": {
      "badge": "企业级服务",
      "title": "专业的AI自媒体解决方案",
      "titleBlue": "助力企业营销成功",
      "subtitle": "企业级AI营销转型不仅需要工具，更需要稳固的基础设施。AI ToEarn 提供可靠的平台，将AI内容创作能力分发到多个部门，实现无与伦比的营销效率。"
    },
    "statsSection": {
      "stats": {
        "users": {
          "number": "50K+",
          "label": "用户"
        },
        "platforms": {
          "number": "15+",
          "label": "社交平台"
        },
        "countries": {
          "number": "100+",
          "label": "国家地区"
        },
        "content": {
          "number": "5M+",
          "label": "内容发布"
        }
      },
      "testimonial": {
        "quote": "在内容营销竞争激烈的今天，快速验证和创作工具不仅有帮助，更是生存必需品。对于我们这样的营销公司来说，AI ToEarn 在这个AI前沿为我们提供了不可或缺的价值。",
        "author": "李明",
        "title": "某知名MCN机构 内容运营总监"
      },
      "caseStudies": {
        "timeSaved": {
          "title": "预计每年节省创作时间",
          "number": "50,000 小时"
        },
        "aiAssistant": {
          "title": "AI营销助手：为500+企业客户提供跨平台内容分发服务"
        }
      }
    },
    "communitySection": {
      "badge": "社区生态",
      "title": "加入我们的",
      "titleBlue": "活跃创作者社区",
      "subtitle": "AI ToEarn 由全球AI内容创作者社区共同推动。加入我们，一起探索AI内容营销的无限边界。",
      "buttons": {
        "wechat": "微信群组",
        "community": "创作者交流群"
      },
      "stats": {
        "downloads": {
          "number": "20万+",
          "label": "下载量"
        },
        "members": {
          "number": "15K",
          "label": "社区成员"
        },
        "creators": {
          "number": "500+",
          "label": "活跃创作者"
        }
      }
    },
    "footer": {
      "resources": {
        "title": "资源",
        "links": {
          "docs": "文档",
          "blog": "博客",
          "education": "教育",
          "partner": "合作伙伴",
          "support": "服务支持",
          "roadmap": "产品线路图"
        }
      },
      "company": {
        "title": "公司",
        "links": {
          "talk": "联系我们",
          "terms": "服务条款",
          "privacy": "隐私政策",
          "cookies": "Cookie 设置",
          "data": "数据删除引导",
          "marketplace": "市场协议",
          "brand": "品牌指南"
        }
      },
      "description": "AI ToEarn 自媒体运营平台一站式解决方案，从灵感创意到内容制作，从内容分发到内容互动管理",
      "social": {
        "github": "GitHub",
        "discord": "Discord",
        "youtube": "YouTube",
        "linkedin": "LinkedIn",
        "twitter": "Twitter"
      },
      "bigText": "Let's Use AI To",
      "copyright": "© 2025 AITOEARN, Corp.",
      "tagline": "",
      "dataDeletion": {
        "title": "Data Deletion Instructions",
        "prelaunch": "Our application is currently in pre-launch phase and does not store real user data. If you have interacted with our test systems, contact us for data removal.",
        "standardTitle": "Standard Procedure (Post-Launch):",
        "standardSteps": [
          "Log in to your AiToEarn account",
          "Navigate to Settings > Privacy",
          "Click \"Request Account Deletion\"",
          "Confirmation will be sent to your registered email"
        ],
        "contactTitle": "Contact for Assistance:",
        "contactEmail": "Email: metat@aitoearning.com (Pre-launch inquiries only)"
      }
    }
  },
  "hot-content": {
    "all": "全部",
    "loading": "加载中...",
    "noData": "暂无数据",
    "rank": "排名",
    "cover": "封面",
    "title": "标题",
    "author": "作者",
    "category": "分类",
    "likes": "点赞",
    "shares": "分享",
    "comments": "评论数",
    "collections": "收藏数",
    "publishTime": "发布于",
    "fans": "粉丝",
    "viewMore": "查看更多",
    "timeRange": "时间范围",
    "filter": "筛选",
    "hotTopics": "热门专题",
    "viralTitles": "爆款标题",
    "topics": "专题",
    "engagement": "互动量",
    "rising": "热",
    "noHotTopics": "暂无热点数据",
    "noViralTitles": "暂无爆款标题数据",
    "noTopicData": "暂无专题数据",
    "total": "共",
    "items": "条",
    "video": "视频",
    "noImage": "暂无图片",
    "platform": "平台",
    "hotEvents": "热点事件",
    "hotContent": "热点内容"
  },
  "login": {
    "welcomeBack": "哎呦赚",
    "emailPlaceholder": "邮箱",
    "passwordPlaceholder": "密码",
    "login": "登录/注册",
    "or": "或",
    "forgotPassword": "忘记密码？",
    "completeRegistration": "完成注册",
    "setPassword": "设置密码",
    "passwordRequired": "请输入密码",
    "passwordMinLength": "密码长度不能小于6位",
    "enterPassword": "请输入密码",
    "inviteCode": "邀请码（选填）",
    "enterInviteCode": "请输入邀请码",
    "waitingForActivation": "等待激活中...",
    "loginSuccess": "登录成功",
    "loginFailed": "登录失败",
    "loginError": "登录失败，请稍后重试",
    "activationEmailSent": "激活链接已发送至邮箱，请查收并点击激活",
    "registerSuccess": "注册成功，已自动登录",
    "checkStatusError": "检查注册状态失败",
    "registerError": "注册失败，请稍后重试",
    "googleLoginFailed": "Google 登录失败"
  },
  "material": {
    "mediaManagement": {
      "title": "媒体资源管理",
      "createGroup": "创建媒体资源组",
      "editGroup": "编辑媒体资源组",
      "aiVideoGenerate": "AI视频生成",
      "groupName": "资源组名称",
      "groupNamePlaceholder": "请输入资源组名称",
      "description": "描述",
      "descriptionPlaceholder": "请输入描述（可选）",
      "type": "类型",
      "video": "视频",
      "image": "图片",
      "create": "创建",
      "save": "保存",
      "cancel": "取消",
      "delete": "删除",
      "edit": "编辑",
      "deleteConfirm": "确定要删除这个媒体资源组吗？",
      "createSuccess": "创建媒体资源组成功",
      "createFailed": "创建媒体资源组失败",
      "updateSuccess": "更新媒体资源组成功",
      "updateFailed": "更新媒体资源组失败",
      "deleteSuccess": "删除媒体资源组成功",
      "deleteFailed": "删除媒体资源组失败",
      "getListFailed": "获取媒体资源组列表失败",
      "noGroups": "暂无媒体资源组",
      "noGroupsDesc": "创建您的第一个媒体资源组，开始管理您的素材",
      "createNow": "立即创建",
      "resources": "个资源",
      "noDescription": "暂无描述"
    },
    "aiGenerate": {
      "title": "AI生成",
      "backToAlbum": "返回相册",
      "textToImage": "文生图",
      "fireflyCard": "Firefly卡片",
      "videoGeneration": "视频生成",
      "prompt": "提示词",
      "promptPlaceholder": "请输入提示词",
      "width": "宽度",
      "height": "高度",
      "generate": "生成",
      "generating": "生成中...",
      "content": "内容",
      "contentPlaceholder": "请输入内容",
      "titlePlaceholder": "请输入标题",
      "template": "模板",
      "uploadToMediaGroup": "上传到媒体组",
      "selectMediaGroup": "选择媒体组",
      "selectMediaGroupPlaceholder": "请选择媒体组",
      "upload": "上传",
      "uploading": "上传中...",
      "uploadSuccess": "上传成功",
      "uploadFailed": "上传失败",
      "getMediaGroupListFailed": "获取媒体组列表失败",
      "pleaseEnterPrompt": "请输入提示词",
      "pleaseSelectMediaGroup": "请选择媒体组",
      "pleaseEnterContent": "请输入内容",
      "pleaseEnterTitle": "请输入标题",
      "selectSize": "选择尺寸",
      "generateCount": "生成数量",
      "imageQuality": "图片质量",
      "imageStyle": "图片风格",
      "selectModel": "选择模型",
      "standard": "标准",
      "hd": "高清",
      "vivid": "生动",
      "natural": "自然",
      "goldCardTemplate": "金卡模板",
      "memoTemplate": "备忘录模板",
      "simpleTemplate": "简约模板",
      "blackSunTemplate": "黑日模板",
      "templateE": "模板 E",
      "writingTemplate": "写作模板",
      "codeTemplate": "代码模板",
      "templateD": "模板 D",
      "videoPromptPlaceholder": "请输入视频描述",
      "videoDuration": "视频时长",
      "videoSize": "视频尺寸",
      "videoMode": "生成模式",
      "uploadImage": "上传图片",
      "imageUrlPlaceholder": "图片URL或base64",
      "taskStatus": "任务状态",
      "taskSubmitted": "任务已提交",
      "taskProcessing": "任务处理中",
      "taskCompleted": "任务完成",
      "taskFailed": "任务失败",
      "checkStatus": "检查状态",
      "videoGenerationFailed": "视频生成失败",
      "videoGenerationSuccess": "视频生成成功",
      "pleaseEnterVideoPrompt": "请输入视频描述",
      "pleaseSelectVideoModel": "请选择视频模型",
      "videoUploadSuccess": "视频上传成功",
      "videoUploadFailed": "视频上传失败",
      "md2card": "Markdown转卡片",
      "markdownPlaceholder": "请输入Markdown内容",
      "selectTheme": "选择主题",
      "themeMode": "主题模式",
      "lightMode": "浅色模式",
      "darkMode": "深色模式",
      "cardWidth": "卡片宽度",
      "cardHeight": "卡片高度",
      "splitMode": "分割模式",
      "noSplit": "不分割",
      "split": "分割",
      "mdxMode": "MDX模式",
      "overHiddenMode": "溢出隐藏",
      "generateCard": "生成卡片",
      "cardGenerationFailed": "卡片生成失败",
      "cardUploadSuccess": "卡片上传成功",
      "cardUploadFailed": "卡片上传失败",
      "pleaseEnterMarkdown": "请输入Markdown内容",
      "imageGenerationFailed": "生成图片失败",
      "fireflyCardGenerationFailed": "生成流光卡片失败",
      "pleaseEnterContentAndTitle": "请输入内容和标题",
      "taskSubmittedSuccess": "任务已提交",
      "videoGenerationSuccess": "视频生成成功",
      "checkVideoTaskStatusFailed": "检查视频任务状态失败",
      "pleaseEnterVideoDescription": "请输入视频描述",
      "selectSizePlaceholder": "选择尺寸",
      "generateCountPlaceholder": "生成数量",
      "imageQualityPlaceholder": "图片质量",
      "imageStylePlaceholder": "图片风格",
      "selectModelPlaceholder": "选择模型",
      "selectVideoModelPlaceholder": "选择视频模型",
      "textToVideo": "文本转视频",
      "imageToVideo": "图片转视频",
      "seconds": "秒",
      "selectThemePlaceholder": "选择主题",
      "themeModePlaceholder": "主题模式",
      "cardWidthPlaceholder": "卡片宽度",
      "cardHeightPlaceholder": "卡片高度",
      "splitModePlaceholder": "分割模式",
      "markdownToCard": "Markdown转卡片",
      "markdownCard": "Markdown卡片",
      "templateA": "默认",
      "templateB": "透明",
      "templateC": "金句",
      "templateJin": "书摘",
      "templateMemo": "便当",
      "templateEasy": "边框",
      "templateWrite": "手写"
    }
  },
  "pinterest": {
    "title": "Pinterest 管理",
    "tabs": {
      "boards": "我的Board",
      "pins": "我的Pin"
    },
    "actions": {
      "selectAccount": "选择账户",
      "refresh": "刷新",
      "createBoard": "创建Board",
      "createPin": "创建Pin",
      "search": "搜索...",
      "view": "查看",
      "edit": "编辑",
      "delete": "删除",
      "link": "链接"
    },
    "stats": {
      "followers": "关注者",
      "boardCount": "Board数量",
      "pinCount": "Pin数量",
      "monthlyViews": "月观看量"
    },
    "board": {
      "createTitle": "创建新Board",
      "name": "Board名称",
      "namePlaceholder": "输入Board名称",
      "description": "描述",
      "descriptionPlaceholder": "输入Board描述",
      "privacy": "隐私设置",
      "public": "公开",
      "private": "私有",
      "createButton": "创建Board",
      "deleteConfirm": "确定删除此Board吗？",
      "detailTitle": "Board详情",
      "createTime": "创建时间",
      "noDescription": "暂无描述"
    },
    "pin": {
      "createTitle": "创建新Pin",
      "selectBoard": "选择Board",
      "selectBoardPlaceholder": "选择要发布到的Board",
      "uploadImage": "上传图片",
      "uploadImagePlaceholder": "点击上传图片到OSS",
      "uploadHint": "支持JPG、PNG、GIF格式，最大10MB",
      "uploading": "正在上传到OSS...",
      "uploadSuccess": "✓ 上传成功",
      "reupload": "重新上传",
      "ossUrl": "OSS地址",
      "title": "标题",
      "titlePlaceholder": "输入Pin标题",
      "description": "描述",
      "descriptionPlaceholder": "输入Pin描述",
      "link": "链接",
      "linkPlaceholder": "输入目标链接（可选）",
      "altText": "Alt文本",
      "altTextPlaceholder": "输入图片Alt文本（可选）",
      "dominantColor": "主色调",
      "dominantColorTip": "选择Pin的主色调",
      "createButton": "创建Pin",
      "deleteConfirm": "确定删除此Pin吗？",
      "detailTitle": "Pin详情",
      "pinId": "Pin ID",
      "boardId": "Board ID",
      "creativeType": "创作类型",
      "boardOwner": "Board拥有者",
      "isOwner": "拥有者",
      "isRemovable": "可移除",
      "isStandard": "标准Pin",
      "noDescription": "暂无描述",
      "imageAlt": "Pin图片"
    },
    "badges": {
      "pins": "Pins",
      "followers": "关注者",
      "owner": "拥有者",
      "yes": "是",
      "no": "否"
    },
    "empty": {
      "noBoards": "暂无Board",
      "noPins": "暂无Pin"
    },
    "pagination": {
      "total": "第 {range} 条，共 {total} 条"
    },
    "messages": {
      "loadAccountsFailed": "加载账户列表失败",
      "loadBoardsFailed": "加载Board列表失败",
      "loadPinsFailed": "加载Pin列表失败",
      "boardCreateSuccess": "Board创建成功",
      "boardCreateFailed": "创建Board失败",
      "boardDeleteSuccess": "Board删除成功",
      "boardDeleteFailed": "删除Board失败",
      "pinCreateSuccess": "Pin创建成功",
      "pinCreateFailed": "创建Pin失败",
      "pinDeleteSuccess": "Pin删除成功",
      "pinDeleteFailed": "删除Pin失败",
      "getBoardDetailFailed": "获取Board详情失败",
      "getPinDetailFailed": "获取Pin详情失败",
      "uploadImageFirst": "请先上传图片",
      "selectImageFile": "请选择图片文件",
      "imageSizeLimit": "图片大小不能超过10MB",
      "imageUploadSuccess": "图片上传成功",
      "imageUploadFailed": "图片上传失败，请重试"
    },
    "validation": {
      "boardNameRequired": "请输入Board名称",
      "selectBoardRequired": "请选择Board",
      "titleRequired": "请输入标题",
      "descriptionRequired": "请输入描述"
    },
    "confirm": {
      "ok": "确定",
      "cancel": "取消"
    }
  },
  "pricing": {
    "title": "套餐与定价",
    "subtitle": "选择最适合您需求的套餐，开始您的AI创作之旅",
    "monthly": "月付",
    "yearly": "年付",
    "save50": "省50%",
    "month": "月",
    "credits": "积分",
    "videos": "视频",
    "images": "图片",
    "flashSale50": "限时5折",
    "mostPopular": "最受欢迎",
    "plans": {
      "free": {
        "name": "Free",
        "credits": "最高60 积分",
        "videos": "每月最高可生成60个视频",
        "images": "每月最高可生成120张图片",
        "button": "立即开始"
      },
      "plus": {
        "name": "Plus",
        "credits": "700积分",
        "videos": "每月最高可生成700个视频",
        "images": "每月最高可生成1400张图片",
        "button": "立即购买"
      }
    },
    "features": {
      "textModeration": "文本内容安全审查",
      "imageModeration": "图片内容安全审查",
      "videoModeration": "视频内容安全审查",
      "multiModel": "多模型一站式支持",
      "textToVideo": "文字转视频",
      "imageToVideo": "图像转视频",
      "videoToVideo": "视频到视频",
      "consistentCharacter": "一致的角色视频",
      "aiAnimation": "AI动画生成",
      "aiImage": "AI图像生成",
      "voiceClone": "声音克隆",
      "voiceSynthesis": "声音合成",
      "fasterSpeed": "更快的生成速度",
      "withWatermark": "含水印输出",
      "noWatermark": "无水印输出",
      "storage500M": "存储空间500M",
      "storage5G": "存储空间5G"
    },
    "faq": {
      "title": "常见问题",
      "items": [
        {
          "question": "如何选择合适的套餐？",
          "answer": "如果您是个人用户或刚开始使用AI创作，建议选择Free套餐体验。如果您需要更多功能和更高的使用限制，Plus套餐是更好的选择。"
        },
        {
          "question": "可以随时升级或降级套餐吗？",
          "answer": "是的，您可以随时升级到更高套餐。降级将在当前计费周期结束后生效。"
        },
        {
          "question": "积分是如何计算的？",
          "answer": "积分根据您生成的内容类型和复杂度计算。视频生成消耗更多积分，图片生成消耗较少积分。"
        },
        {
          "question": "支持哪些支付方式？",
          "answer": "我们支持信用卡、借记卡、PayPal等多种支付方式，确保安全便捷的支付体验。"
        },
        {
          "question": "有退款政策吗？",
          "answer": "我们提供7天无理由退款保证。如果您对服务不满意，可以在购买后7天内申请全额退款。"
        }
      ]
    }
  },
  "profile": {
    "personalInfo": "个人信息",
    "orderManagement": "订单管理",
    "myOrders": "我的订单",
    "mySubscriptions": "我的订阅",
    "plusMember": "PLUS会员",
    "vipUserGreeting": "尊敬的VIP用户，您已解锁全部会员权益",
    "vipDescription": "开通会员解锁全部功能，立享8种权益",
    "activateNow": "立即开通",
    "modifyUsername": "修改用户名",
    "logout": "退出登录",
    "userId": "用户ID",
    "username": "用户名",
    "email": "邮箱",
    "accountStatus": "账号状态",
    "normal": "正常",
    "disabled": "禁用",
    "memberType": "会员类型",
    "memberExpireTime": "会员到期时间",
    "nonMember": "非会员",
    "monthlyMember": "月度会员",
    "yearlyMember": "年度会员",
    "unknown": "未知",
    "upgradeCallToAction": "开通PLUS会员，体验更多高级功能！",
    "activatePlusMember": "立即开通PLUS会员",
    "orderId": "订单ID",
    "packageType": "套餐类型",
    "amount": "金额",
    "status": "状态",
    "createTime": "创建时间",
    "expireTime": "过期时间",
    "actions": "操作",
    "viewDetails": "查看详情",
    "goToPay": "去支付",
    "subscriptionId": "订阅ID",
    "cancelSubscription": "退订",
    "cancelSubscriptionConfirm": "确定要退订吗？退订后将无法享受会员权益。",
    "confirm": "确定",
    "cancel": "取消",
    "orderDetails": "订单详情",
    "close": "关闭",
    "goToPayment": "前往支付",
    "internalId": "内部ID",
    "subscriptionMode": "订阅模式",
    "refundedAmount": "已退款金额",
    "paymentIntent": "Payment Intent",
    "paymentLink": "支付链接",
    "openPaymentPage": "打开支付页面",
    "totalRecords": "共 {total} 条记录",
    "loading": "加载中...",
    "noOrderRecords": "暂无订单记录",
    "noSubscriptionRecords": "暂无订阅记录",
    "pleaseLoginFirst": "请先登录",
    "logoutSuccess": "退出登录成功",
    "updateSuccess": "更新成功",
    "updateFailed": "更新失败",
    "getUserInfoFailed": "获取用户信息失败",
    "getOrderListFailed": "获取订单列表失败",
    "getSubscriptionListFailed": "获取订阅列表失败",
    "refundSubmitted": "退款申请已提交",
    "refundFailed": "退款失败",
    "unsubscribeSuccess": "退订成功",
    "unsubscribeFailed": "退订失败",
    "getOrderDetailFailed": "获取订单详情失败",
    "pleaseEnterUsername": "请输入用户名",
    "usernameLengthMin": "用户名长度不能小于2个字符",
    "usernameLengthMax": "用户名长度不能超过20个字符",
    "confirmModify": "确认修改",
    "monthlySubscription": "月度订阅",
    "yearlySubscription": "年度订阅",
    "oneTimeMonthly": "一次性月度",
    "oneTimeYearly": "一次性年度",
    "paymentSuccess": "支付成功",
    "waitingForPayment": "等待支付",
    "refundSuccess": "退款成功",
    "orderCancelled": "订单取消",
    "subscriptionSuccess": "订阅成功",
    "subscriptionCancelled": "已取消",
    "vipBenefits": {
      "exclusiveBadge": "专属标识",
      "advancedFeatures": "高级功能",
      "memberGift": "会员礼包",
      "prioritySupport": "优先支持",
      "discount": "优惠折扣",
      "unlimitedTime": "无限时长",
      "fastExperience": "极速体验",
      "morePrivileges": "更多特权"
    },
    "points": {
      "title": "积分记录",
      "myPoints": "我的积分",
      "pointsDescription": "查看您的积分变动记录和使用情况",
      "pointsChange": "积分变动",
      "balance": "余额",
      "changeType": "变动类型",
      "description": "描述",
      "time": "时间",
      "earn": "获得",
      "spend": "消费",
      "refund": "退还",
      "expire": "过期",
      "aiService": "AI服务",
      "userRegister": "用户注册",
      "noPointsRecords": "暂无积分记录",
      "totalRecords": "共 {{total}} 条记录"
    },
    "freeTrial": {
      "title": "🎉 免费会员体验",
      "congratulations": "恭喜您获得7天免费会员体验！",
      "description": "作为新用户，您可以享受7天的免费会员权益，体验所有高级功能，包括：",
      "unlimitedAI": "✓ 无限制AI生成",
      "priorityProcessing": "✓ 优先处理",
      "advancedModels": "✓ 高级模型",
      "dedicatedSupport": "✓ 专属客服",
      "noAds": "✓ 无广告体验",
      "morePrivileges": "✓ 更多特权",
      "completelyFree": "🎁 完全免费，无需支付任何费用",
      "claimNow": "立即领取",
      "later": "稍后再说"
    }
  },
  "publish": {
    "title": "发布作品",
    "confirmClose": {
      "title": "确认关闭",
      "content": "关闭后，已填写的内容将丢失，是否确认关闭？"
    },
    "buttons": {
      "customizePerAccount": "自定义每个账户",
      "cancelPublish": "取消发布",
      "schedulePublish": "定时发布",
      "publishNow": "立即发布",
      "copyLink": "复制链接",
      "delete": "删除"
    },
    "tips": {
      "workSaved": "请选择要发布的账户"
    },
    "status": {
      "publishFailed": "发布失败",
      "publishing": "发布中",
      "publishSuccess": "发布成功",
      "waitingPublish": "等待发布"
    },
    "form": {
      "title": "标题",
      "titlePlaceholder": "请输入标题",
      "partition": "分区",
      "partitionPlaceholder": "请选择分区",
      "type": "类型",
      "original": "原创",
      "reprint": "转载",
      "source": "转载来源",
      "sourcePlaceholder": "转载视频请注明来源、时间、地点(例：转自https://www.xxxx.com/yyyy)",
      "page": "页面",
      "pagePlaceholder": "请选择页面",
      "privacyStatus": "隐私状态",
      "public": "公开",
      "unlisted": "不公开",
      "private": "私人",
      "region": "国区",
      "regionPlaceholder": "请选择国区",
      "category": "视频分类",
      "categoryPlaceholder": "请选择视频分类",
      "categoryPlaceholderDisabled": "请先选择国区"
    },
    "upload": {
      "finishingUp": "正在完成...",
      "uploadImageOrVideo": "上传图片或视频",
      "dragAndSelect": "拖放 & 选择图片或视频"
    },
    "validation": {
      "facebookStoryNoDes": "Facebook Story不支持填写描述",
      "facebookReelNoImage": "Facebook Reel不支持上传图片",
      "instagramStoryNoDes": "Instagram Story不支持填写描述",
      "instagramReelNoImage": "Instagram Reel不支持上传图片",
      "instagramPostNoVideo": "Instagram post不支持上传视频",
      "titleMaxExceeded": "{{platformName}}标题最多{{maxCount}}字",
      "descriptionMaxExceeded": "{{platformName}}描述最多{{maxCount}}字",
      "descriptionRequired": "描述是必须的",
      "imageMaxExceeded": "{{platformName}}图片最多不能超过{{maxCount}}张",
      "uploadImageOrVideo": "请上传图片或视频",
      "topicMaxExceeded": "{{platformName}}话题最多不能超过{{maxCount}}个",
      "topicFormatError": "描述中的话题必须使用空格分割，如：\"#话题1 #话题2\"",
      "titleRequired": "标题是必须的",
      "topicRequired": "话题是必须的",
      "partitionRequired": "您必须选择分区!",
      "sourceRequired": "转载时必须填写转载来源!",
      "pageRequired": "您必须选择页面!",
      "coverSizeError": "封面最小尺寸400*400!"
    },
    "preview": {
      "title": "预览",
      "emptyDescription": "在这里看到你的作品预览"
    },
    "draft": {
      "selectDraft": "选择草稿",
      "selectDraftGroup": "选择草稿箱组",
      "selectDraftItem": "选择草稿",
      "noDraftGroups": "暂无草稿箱组",
      "noDrafts": "该组暂无草稿",
      "backToGroups": "返回草稿箱组",
      "selectDraftSuccess": "草稿已应用",
      "imageGroup": "图文组",
      "videoGroup": "视频组",
      "selectLibrary": "选择素材库",
      "selectLibraryItem": "选择素材",
      "selectLibraryGroup": "选择素材库组",
      "noLibraryGroups": "暂无素材库组",
      "backToLibraryGroups": "返回素材库组",
      "noLibraryItems": "该组暂无素材",
      "selectLibrarySuccess": "素材已应用"
    },
    "actions": {
      "selectMaterial": "选择素材",
      "selectDraft": "选择草稿"
    }
  },
  "route": {
    "home": "首页",
    "accounts": "账户",
    "publish": "发布",
    "hotContent": "热门内容",
    "hotContentNew": "热门内容新",
    "navigation": "导航"
  },
  "translation": {
    "title": "AIToEarn官方网站",
    "content": "最好用的开源矩阵工具"
  },
  "vip": {
    "title": "PLUS会员",
    "description": "开通会员解锁全部功能，立享8种权益",
    "activateNow": "立即开通",
    "pleaseLoginFirst": "请先登录",
    "paymentOrderCreated": "支付订单创建成功",
    "paymentLinkNotFound": "未获取到支付链接",
    "createPaymentOrderFailed": "创建支付订单失败",
    "createPaymentOrderError": "创建支付订单失败，请稍后重试",
    "trialNotice": {
      "badge": "🎉 新用户专享",
      "description": "选择连续包月或连续包年，可享受7天免费试用期！"
    },
    "trialText": {
      "month": "前7天免费，之后$15/月",
      "year": "前7天免费，之后$120/年"
    },
    "badge": {
      "onceMonth": "一次性",
      "month": "7天免费试用",
      "year": "7天免费试用",
      "monthOld": "25%优惠",
      "yearOld": "50%优惠"
    },
    "vipBenefits": {
      "exclusiveBadge": "专属标识",
      "advancedFeatures": "高级功能",
      "memberGift": "会员礼包",
      "prioritySupport": "优先支持",
      "discount": "优惠折扣",
      "unlimitedTime": "无限时长",
      "fastExperience": "极速体验",
      "morePrivileges": "更多特权"
    },
    "plans": {
      "onceMonth": "一次性月度",
      "month": "月度订阅",
      "year": "年度订阅"
    }
  },
  "youtube": {
    "youtubeAuth": "YouTube 授权",
    "authDescription": "请输入您的邮箱地址以获取 YouTube 授权",
    "email": "邮箱",
    "enterEmail": "请输入邮箱地址",
    "authorize": "授权",
    "pleaseEnterEmail": "请输入邮箱地址",
    "invalidEmail": "请输入有效的邮箱地址",
    "authFailed": "授权失败，请稍后重试",
    "checkAuth": "检查授权",
    "notAuthorized": "未授权",
    "uploadVideo": "上传视频",
    "needAuthFirst": "首先需要授权",
    "uploadFailed": "上传失败",
    "uploadSuccess": "上传成功",
    "checkFailed": "检查失败",
    "alreadyAuthorized": "已授权"
  }
}

export default Resources;
