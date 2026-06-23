# materials API

## 模块边界

OSS 上传、媒体库、草稿素材、素材组与公开素材查询。

## 文件清单

- `material.api.ts`
- `material.constants.ts`
- `material.types.ts`

## 接口清单

| 方法                         | 请求                                      | 说明                            |
| ---------------------------- | ----------------------------------------- | ------------------------------- |
| `apiBatchDeleteMaterials`    | `DELETE material/list`                    | 批量删除草稿                    |
| `apiCreateMaterial`          | `POST material`                           | 创建草稿                        |
| `apiCreateMaterialGroup`     | `POST material/group`                     | 创建草稿分组                    |
| `apiDeleteMaterial`          | `DELETE material/{param}`                 | 删除草稿                        |
| `apiDeleteMaterialGroup`     | `DELETE material/group/{param}`           | 删除草稿分组                    |
| `apiFilterDeleteMaterials`   | `DELETE material/filter`                  | 按条件删除草稿                  |
| `apiGetDraftInfo`            | `GET material/info/{param}`               | 获取草稿详情                    |
| `apiGetMaterialGroupList`    | `GET material/group/list/{param}/{param}` | 获取草稿分组列表                |
| `apiGetMaterialInfo`         | `GET material/group/info/{param}`         | 获取草稿分组详情                |
| `apiGetMaterialList`         | `GET material/list/{param}/{param}`       | 获取草稿列表                    |
| `apiGetOptimalMaterial`      | `GET /material/optimal`                   | 通过素材组 ID 获取最优素材      |
| `apiGetMaterialGroupByScene` | `GET /material/group/by-scene`            | 按使用场景查询素材组            |
| `apiTransferMaterials`       | `POST material/transfer`                  | 草稿转移到其他草稿箱            |
| `apiUpdateMaterial`          | `PUT material/info/{param}`               | 更新草稿信息                    |
| `apiUpdateMaterialGroupInfo` | `POST material/group/info/{param}`        | 更新草稿分组信息                |
| `batchDeleteMedia`           | `DELETE media/ids`                        | 批量删除媒体资源                |
| `getMediaList`               | `GET media/list/{param}/{param}`          | 获取媒体资源列表                |
| `getVideoThumbnail`          | `GET assets/thumbnail`                    | Get Video Thumbnail             |
| `transferMedia`              | `POST media/transfer`                     | 媒体资源转移到其他分组          |
| `uploadToOss`                | `前端封装`                                | 上传文件到OSS (前端直传 AWS S3) |

## 类型清单

| 名称                            | 类型        | 说明                                  |
| ------------------------------- | ----------- | ------------------------------------- |
| `ConfirmUploadData`             | `interface` | ConfirmUploadData 数据结构。          |
| `CreateMaterialGroupParams`     | `interface` | CreateMaterialGroupParams 请求参数。  |
| `CreateMaterialGroupVo`         | `interface` | 创建素材组响应。                      |
| `CreateMaterialParams`          | `interface` | 创建草稿请求参数。                    |
| `GetMaterialGroupBySceneParams` | `interface` | 按使用场景查询素材组请求参数。        |
| `MaterialFilterDeleteParams`    | `interface` | MaterialFilterDeleteParams 请求参数。 |
| `MaterialGenerationParams`      | `interface` | MaterialGenerationParams 请求参数。   |
| `MaterialGroupBySceneData`      | `type`      | 按使用场景查询素材组原始响应数据。    |
| `MaterialGroupListFilters`      | `interface` | MaterialGroupListFilters 类型。       |
| `MaterialGroupListVo`           | `interface` | 素材组列表响应。                      |
| `MaterialGroupSceneVo`          | `interface` | MaterialGroupSceneVo 响应数据。       |
| `MaterialGroupUseScene`         | `type`      | MaterialGroupUseScene 类型。          |
| `MaterialListFilters`           | `interface` | MaterialListFilters 类型。            |
| `MaterialListQueryParams`       | `interface` | 素材列表查询参数。                    |
| `MaterialListVo`                | `interface` | 素材列表响应。                        |
| `MaterialOpenApiResponse`       | `type`      | 公开素材接口响应包装。                |
| `MaterialPagination`            | `interface` | 素材分页信息。                        |
| `MediaGroup`                    | `interface` | MediaGroup 类型。                     |
| `MediaItem`                     | `interface` | MediaItem 数据结构。                  |
| `MediaListFilters`              | `interface` | 媒体列表查询参数。                    |
| `MediaListResponse`             | `interface` | 媒体列表响应。                        |
| `MediaMetadata`                 | `interface` | MediaMetadata 类型。                  |
| `OptimalMaterialVo`             | `interface` | 公开推广码最优素材响应数据。          |
| `PlanStatistics`                | `interface` | PlanStatistics 数据结构。             |
| `PromotionMaterial`             | `interface` | PromotionMaterial 类型。              |
| `PromotionPlan`                 | `interface` | PromotionPlan 类型。                  |
| `PublishRecord`                 | `interface` | PublishRecord 数据结构。              |
| `ThumbnailVo`                   | `interface` | ThumbnailVo 响应数据。                |
| `TransferMaterialParams`        | `interface` | TransferMaterialParams 请求参数。     |
| `TransferMediaParams`           | `interface` | TransferMediaParams 请求参数。        |
| `TransferMediaResult`           | `interface` | 素材转移结果。                        |
| `UpdateMaterialGroupParams`     | `interface` | 素材组更新请求参数。                  |
| `UpdateMaterialParams`          | `interface` | 更新草稿请求参数。                    |
| `UploadSignData`                | `interface` | UploadSignData 数据结构。             |
| `UploadToOssOptions`            | `interface` | UploadToOssOptions 数据结构。         |

## 常量清单

| 名称        | 类型   | 说明             |
| ----------- | ------ | ---------------- |
| `AssetType` | `enum` | AssetType 枚举。 |
