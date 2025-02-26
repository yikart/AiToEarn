import { ForwardedRef, forwardRef, memo } from 'react';
import { PubType } from '../../../../commont/publish/PublishEnum';
import styles from './supportPlat.module.scss';
import { AccountPlatInfoMap } from '@/views/account/comment';

export interface ISupportPlatRef {}

export interface ISupportPlatProps {
  pubType: PubType;
  // 0=视频发布样式、1=文章、图片 样式
  type: 0 | 1;
}

const SupportPlat = memo(
  forwardRef(
    (
      { pubType, type }: ISupportPlatProps,
      ref: ForwardedRef<ISupportPlatRef>,
    ) => {
      return (
        <div className={styles.supportPlat}>
          <div className="supportPlat-tip">
            <p className="supportPlat-tip--line" />
            <p className="supportPlat-tip-text">支持以下平台</p>
            <p className="supportPlat-tip--line" />
          </div>
          <ul
            className={`supportPlat-con ${type === 1 ? 'supportPlat-centerCon' : ''}`}
          >
            {Array.from(AccountPlatInfoMap).map(([k, v]) => {
              if (!v.pubTypes.has(pubType)) return null;
              return (
                <li key={v.name}>
                  <img src={v.icon} />
                </li>
              );
            })}
          </ul>
        </div>
      );
    },
  ),
);
SupportPlat.displayName = 'SupportPlat';

export default SupportPlat;
