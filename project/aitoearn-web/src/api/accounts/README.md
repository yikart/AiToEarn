# accounts API

## 模块边界

渠道账号、账号分组与排序。

## 文件清单

- `account.api.ts`
- `account.types.ts`

## 接口清单

| 方法                            | 请求                                         | 说明         |
| ------------------------------- | -------------------------------------------- | ------------ |
| `apiUpdateAccountGroupSortRank` | `PATCH v2/channels/account-groups/{param}`   | 更新分组排序 |
| `createAccountGroupApi`         | `POST v2/channels/account-groups`            | 创建账号分组 |
| `createChannelAccountApi`       | `POST v2/channels/accounts`                  | 创建账号     |
| `deleteAccountApi`              | `DELETE v2/channels/accounts/{param}`        | 删除账号     |
| `deleteAccountGroupApi`         | `DELETE v2/channels/account-groups`          | 删除账号分组 |
| `getAccountDetailApi`           | `GET v2/channels/accounts/{param}`           | 账号详情     |
| `getAccountGroupApi`            | `GET v2/channels/account-groups`             | 账号分组列表 |
| `getAccountListApi`             | `GET v2/channels/accounts`                   | 账号列表     |
| `refreshAccountFansApi`         | `GET v2/channels/accounts/{param}/analytics` | 账号数据     |
| `updateAccountGroupApi`         | `PATCH v2/channels/account-groups/{param}`   | 更新账号分组 |

## 类型清单

| 名称                         | 类型        | 说明                                  |
| ---------------------------- | ----------- | ------------------------------------- |
| `AccountGroupItem`           | `interface` | AccountGroupItem 数据结构。           |
| `AccountListData`            | `interface` | AccountListData 数据结构。            |
| `CreateChannelAccountParams` | `interface` | CreateChannelAccountParams 请求参数。 |
| `SocialAccount`              | `interface` | SocialAccount 类型。                  |
| `SortRankItem`               | `interface` | SortRankItem 数据结构。               |
| `SortRankRequest`            | `interface` | SortRankRequest 请求参数。            |

## 常量清单

| 名称 | 类型 | 说明 |
| ---- | ---- | ---- |
