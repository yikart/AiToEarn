import { VideoPul } from '../views/publish/children/videoPage/comment';
import { AccountType } from '../../commont/AccountEnum';

/**
 * 获取视频发布预览的地址
 * @param videoRecord
 */
export function getVideoPreviewPage(videoRecord: VideoPul) {
  let url = '';
  switch (videoRecord.type) {
    case AccountType.Douyin:
      url = `https://www.douyin.com/user/self?from_tab_name=main&modal_id=${videoRecord.dataId}&showTab=post`;
      break;
    case AccountType.Xhs:
      url = `https://www.xiaohongshu.com/explore/${videoRecord.dataId}?xsec_token=${videoRecord.videoPubOtherData![AccountType.Xhs]!.xsec_token}&xsec_source=${videoRecord.videoPubOtherData![AccountType.Xhs]!.xsec_source}`;
      break;
  }
  return url;
}
