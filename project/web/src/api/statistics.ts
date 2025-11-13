import http from '@/utils/request'

// 导入发布记录到草稿箱
export async function apiImportPostsRecord(records: Array<{
  accountId: string
  platform: string
  userId: string
  uid: string
  postId: string
}>) {
  return http.post('statistics/channels/posts/postsRecord', {
    records,
  })
}

// 获取发布记录状态
export async function apiGetPostsRecordStatus() {
  return http.post('statistics/channels/posts/recordStatus', {
  })
}
