import { ForwardedRef, forwardRef, memo, useState } from 'react';
import styles from './rankingTags.module.scss';

export interface IRankingtagsRef {}

export interface IRankingtagsProps {
  options: {
    label: string;
    value: string;
  }[];
  defaultValue: string;
  disable?: boolean;
  onChange: (value: string) => void;
}

const Rankingtags = memo(
  forwardRef(
    (
      { options, defaultValue, disable, onChange }: IRankingtagsProps,
      ref: ForwardedRef<IRankingtagsRef>,
    ) => {
      const [activeValue, setActiveValue] = useState(defaultValue);

      return (
        <div className={styles.rankingTags}>
          {options.map((v) => {
            return (
              <div
                className={[
                  'rankingTags-tag',
                  activeValue === v.value ? 'rankingTags-tag--active' : '',
                ].join(' ')}
                key={v.value}
                onClick={() => {
                  if (disable) return;
                  onChange(v.value);
                  setActiveValue(v.value);
                }}
              >
                {v.label}
              </div>
            );
          })}
        </div>
      );
    },
  ),
);
Rankingtags.displayName = 'Rankingtags';

export default Rankingtags;
