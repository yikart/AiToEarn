#!/bin/bash
# 准备开源仓库脚本
# 用法: 在内部 monorepo 根目录运行 bash scripts/prepare-opensource.sh
set -euo pipefail

echo "=== 步骤 1: 删除不需要的 apps 和 libs ==="

# 删除 apps
rm -rf apps/aitoearn-admin-server
rm -rf apps/aitoearn-payment
rm -rf apps/aitoearn-task

# 删除 libs
rm -rf libs/aitoearn-admin-client libs/aitoearn-payment-client libs/aitoearn-task-client
rm -rf libs/listmonk libs/ali-green libs/alipay libs/amap libs/ansible
rm -rf libs/maps libs/metric-db libs/one-signal libs/payment-db
rm -rf libs/statistics-db libs/stripe libs/task-db libs/ucloud libs/wise

# 删除独立目录
rm -rf migrations/ scripts/migrations/ tools/ e2e/

echo "=== 步骤 2: 删除 aitoearn-server 功能模块 ==="
rm -rf apps/aitoearn-server/src/core/app-configs/
rm -rf apps/aitoearn-server/src/core/app-release/
rm -rf apps/aitoearn-server/src/core/brand-lib/
rm -rf apps/aitoearn-server/src/core/campaign/
rm -rf apps/aitoearn-server/src/core/feedback/
rm -rf apps/aitoearn-server/src/core/google-maps/
rm -rf apps/aitoearn-server/src/core/maps-test/
rm -rf apps/aitoearn-server/src/core/manager/
rm -rf apps/aitoearn-server/src/core/statistics/
rm -rf apps/aitoearn-server/src/core/uptime/
rm -rf apps/aitoearn-server/src/core/user-event/
rm -rf apps/aitoearn-server/src/core/ai-green/

echo "=== 步骤 3: 删除 aitoearn-server VIP 相关文件 ==="
rm -f apps/aitoearn-server/src/core/user/vip.service.ts
rm -f apps/aitoearn-server/src/core/user/vip-purchase.consumer.ts
rm -f apps/aitoearn-server/src/core/user/vip-renewal.consumer.ts
rm -f apps/aitoearn-server/src/core/credits/monthly-credits-grant.consumer.ts
rm -f apps/aitoearn-server/src/core/notification/mail.service.ts

echo "=== 步骤 4: 删除 aitoearn-ai 功能模块 ==="
rm -rf apps/aitoearn-ai/src/core/ai-availability/
rm -f apps/aitoearn-ai/src/core/agent/agent-analysis.service.ts
rm -f apps/aitoearn-ai/src/core/agent/agent-analysis.consumer.ts
rm -f apps/aitoearn-ai/src/core/agent/agent-week-summary.service.ts
rm -f apps/aitoearn-ai/src/core/agent/agent-week-summary.scheduler.ts
rm -f apps/aitoearn-ai/src/core/agent/mcp/brand-store.mcp.ts

echo "=== 步骤 5: 删除共享代码文件 ==="
# MongoDB schemas
rm -f libs/mongodb/src/schemas/agent-week-summary.schema.ts
rm -f libs/mongodb/src/schemas/app-config.schema.ts
rm -f libs/mongodb/src/schemas/app-release.schema.ts
rm -f libs/mongodb/src/schemas/brand-library.schema.ts
rm -f libs/mongodb/src/schemas/brand-store-review.schema.ts
rm -f libs/mongodb/src/schemas/campaign.schema.ts
rm -f libs/mongodb/src/schemas/campaign-application.schema.ts
rm -f libs/mongodb/src/schemas/feedback.schema.ts
rm -f libs/mongodb/src/schemas/manager.schema.ts
rm -f libs/mongodb/src/schemas/uptime.schema.ts

# MongoDB repositories
rm -f libs/mongodb/src/repositories/agent-week-summary.repository.ts
rm -f libs/mongodb/src/repositories/app-config.repository.ts
rm -f libs/mongodb/src/repositories/app-release.repository.ts
rm -f libs/mongodb/src/repositories/brand-library.repository.ts
rm -f libs/mongodb/src/repositories/brand-store-review.repository.ts
rm -f libs/mongodb/src/repositories/campaign.repository.ts
rm -f libs/mongodb/src/repositories/campaign-application.repository.ts
rm -f libs/mongodb/src/repositories/feedback.repository.ts
rm -f libs/mongodb/src/repositories/manager.repository.ts
rm -f libs/mongodb/src/repositories/uptime.repository.ts
rm -f libs/mongodb/src/repositories/vip.repository.ts
rm -rf libs/mongodb/src/repositories/admin/

# MongoDB enums
rm -f libs/mongodb/src/enums/brand-library.enum.ts
rm -f libs/mongodb/src/enums/app-release.enum.ts
rm -f libs/mongodb/src/enums/campaign.enum.ts
rm -f libs/mongodb/src/enums/feedback.enum.ts

# Common
rm -f libs/common/src/constants/vip.constant.ts
rm -f libs/common/src/enums/vip.enum.ts

# Helpers
rm -rf libs/helpers/src/uptime/

# Queue interfaces
rm -f libs/aitoearn-queue/src/interfaces/vip-data.interface.ts
rm -f libs/aitoearn-queue/src/interfaces/agent-task-analysis.interface.ts
rm -f libs/aitoearn-queue/src/interfaces/user-event-batch-data.interface.ts
rm -f libs/aitoearn-queue/src/interfaces/monthly-credits-grant-data.interface.ts

echo "=== 删除完成 ==="
echo ""
echo "接下来需要手动修改以下文件（详见 docs/opensource-sync-guide.md）："
echo ""
echo "  === aitoearn-server ==="
echo "  - src/app.module.ts (移除已删除模块的 module imports)"
echo "  - src/config.ts (移除 schema 字段)"
echo "  - config/config.js (移除环境变量和配置项)"
echo "  - package.json (移除 workspace 依赖)"
echo "  - src/core/notification/ (移除 OneSignal/MailService)"
echo "  - src/core/user/ (移除 VIP 相关, AitoearnTaskClient, UserAccessLog, CreditsService)"
echo "  - src/core/channel/ (移除 AitoearnTaskClient, PostData, StatisticsModule)"
echo "  - src/core/account/ (移除 AitoearnTaskClient, StatisticsModule)"
echo "  - src/core/credits/ (移除 VIP/积分发放/scheduler)"
echo "  - src/core/internal/ (移除 VIP endpoints, PromotionPost)"
echo "  - src/core/publish-record/ (移除 AitoearnTaskClient)"
echo "  - src/common/enums/redlock-key.enum.ts (移除 MonthlyCreditsGrant)"
echo ""
echo "  === aitoearn-ai ==="
echo "  - src/app.module.ts (移除 AiAvailabilityModule)"
echo "  - src/config.ts (移除 aiAvailability, freeForVip, agent analysis)"
echo "  - config/config.js (价格归零, 移除 aiAvailability, agent analysis)"
echo "  - src/core/agent/ (移除分析/周报/品牌库/BrandStoreMcp)"
echo "  - src/core/agent/mcp/*.mcp.ts (移除 UptimeHelperService)"
echo "  - src/core/agent/mcp/*.mcp.spec.ts (移除 UptimeHelper mock)"
echo "  - src/core/agent/mcp/mcp.utils.ts (从 wrapTool 移除 UptimeHelper)"
echo "  - src/core/agent/services/agent-runtime.service.ts (移除 BrandLibrary/Uptime/AiAvailability)"
echo "  - src/core/ai/libs/*.service.ts (移除 AiAvailabilityService)"
echo "  - src/core/ai/chat/chat.service.ts (移除 freeForVip)"
echo "  - src/core/ai/image/image.service.ts (移除 freeForVip)"
echo "  - src/core/ai/video/video.service.ts (移除 freeForVip)"
echo "  - src/core/ai/models-config/ (移除 AppConfigRepository, 简化为静态配置)"
echo "  - src/core/draft-generation/ (移除 BrandLibrary/AiAvailability)"
echo "  - src/core/material-adaptation/ (移除 AiAvailability)"
echo "  - src/core/internal/ai.controller.ts (移除 saveModelsConfig)"
echo "  - src/common/enums/redlock-key.enum.ts (移除 AgentWeekSummaryGeneration)"
echo ""
echo "  === libs ==="
echo "  - tsconfig.base.json (移除路径别名)"
echo "  - libs/mongodb/src/schemas/index.ts (移除已删除 schema)"
echo "  - libs/mongodb/src/schemas/user.schema.ts (移除 VipInfo)"
echo "  - libs/mongodb/src/repositories/index.ts (移除已删除 repository)"
echo "  - libs/mongodb/src/repositories/material.repository.ts (移除 countByBrandLibraryId)"
echo "  - libs/mongodb/src/enums/index.ts (移除已删除 enum 导出)"
echo "  - libs/mongodb/src/enums/user.enum.ts (移除 VipStatus)"
echo "  - libs/mongodb/src/enums/asset.enum.ts (移除 BrandLibrary/GooglePlace)"
echo "  - libs/aitoearn-queue/ (移除已删除队列枚举/接口/方法)"
echo "  - libs/common/ (移除 VIP enum/constant/ResponseCode/messages)"
echo "  - libs/helpers/ (移除 uptime 导出和 module)"
echo "  - libs/nest-mcp/ (移除 UptimeHelperService)"
echo "  - libs/assets/ (移除 BrandLibrary/GooglePlace 路径映射)"
echo "  - libs/aitoearn-server-client/ (移除 VIP 相关方法/接口)"
echo ""
echo "修改完成后运行验证："
echo "  pnpm nx run-many --target=build --projects=aitoearn-server,aitoearn-ai"
