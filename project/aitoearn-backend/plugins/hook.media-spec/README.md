# hook.media-spec

图片/视频规格校验钩子（官方插件）。

- `validateDraft`：编辑期保存时返回媒体规格 issue
- `beforePublish`：fail-closed，规格不通过即拒绝发布并透传原因

默认规则：图片 ≤ 9 张、边长 ≥ 10px、视频 ≤ 3600s。
