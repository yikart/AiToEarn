import styles from './image.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useImagePageStore } from './useImagePageStore';

export default function Page() {
  const {} = useImagePageStore(useShallow((state) => ({})));

  return <div className={styles.image}>图片发布</div>;
}
