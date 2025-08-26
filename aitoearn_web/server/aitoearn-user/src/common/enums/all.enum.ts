/*
 * @Author: nevin
 * @Date: 2022-08-02 16:18:04
 * @LastEditTime: 2025-01-15 14:37:02
 * @LastEditors: nevin
 * @Description:
 */
export enum HttpTags {
  DOC = 'doc',
}

// 性别
export enum GenderEnum {
  MALE = 1, // 男
  FEMALE = 2, // 女
}

// 开关
export enum ONOFF {
  ON = 1, // 开
  OFF = 0, // 关
}

// 0 待审核 1 审核通过 -1 审核不通过
export enum CheckStatus {
  PENDING = 0,
  PASS = 1,
  FAIL = -1,
}
