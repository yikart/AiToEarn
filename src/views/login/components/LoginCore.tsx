import styles from '../login.module.scss';
import PhoneLogin from '@/views/login/components/PhoneLogin';

export function LoginCore() {
  return (
    <div className={styles.loginCore}>
      <PhoneLogin />
    </div>
  );
}
