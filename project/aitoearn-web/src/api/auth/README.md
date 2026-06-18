# auth API

## 模块边界

登录、验证码与当前用户信息。

## 文件清单

- `auth.api.ts`
- `auth.types.ts`

## 接口清单

| 方法                | 请求                      | 说明                         |
| ------------------- | ------------------------- | ---------------------------- |
| `emailCodeLoginApi` | `POST login/mail/verify`  | 邮箱验证码登录               |
| `getUserInfoApi`    | `GET user/mine`           | Get Current User Information |
| `googleLoginApi`    | `POST login/google`       | Google 登录                  |
| `phoneCodeLoginApi` | `POST login/phone/verify` | 手机验证码登录               |
| `sendEmailCodeApi`  | `POST login/mail`         | 发送邮箱验证码               |
| `sendPhoneCodeApi`  | `POST login/phone`        | 发送手机验证码               |
| `updateUserInfoApi` | `PUT user/info/update`    | Update User Information      |

## 类型清单

| 名称                   | 类型        | 说明                            |
| ---------------------- | ----------- | ------------------------------- |
| `AuthRequestOptions`   | `interface` | 鉴权请求选项。                  |
| `CodeLoginResponse`    | `interface` | CodeLoginResponse 响应数据。    |
| `EmailCodeLoginParams` | `interface` | EmailCodeLoginParams 请求参数。 |
| `GoogleLoginParams`    | `interface` | GoogleLoginParams 请求参数。    |
| `LoginResponse`        | `interface` | LoginResponse 响应数据。        |
| `PhoneCodeLoginParams` | `interface` | PhoneCodeLoginParams 请求参数。 |
| `SendEmailCodeParams`  | `interface` | SendEmailCodeParams 请求参数。  |
| `SendPhoneCodeParams`  | `interface` | SendPhoneCodeParams 请求参数。  |
| `UpdateUserInfoParams` | `interface` | 更新用户信息请求参数。          |

## 常量清单

| 名称 | 类型 | 说明 |
| ---- | ---- | ---- |
