import { ForwardedRef, forwardRef, memo } from 'react';
import styles from './cycleSelects.module.scss';

export interface ICycleselectsRef {}

export interface ICycleselectsProps {}

const CycleseCore = () => {
  return <></>;
};

const Cycleselects = memo(
  forwardRef(({}: ICycleselectsProps, ref: ForwardedRef<ICycleselectsRef>) => {
    return (
      <div className={styles.cycleSelects}>
        <CycleseCore />
      </div>
    );
  }),
);
Cycleselects.displayName = 'Cycleselects';

export default Cycleselects;
