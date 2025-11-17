'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import styles from './register.module.css'

export default function RegisterPage() {
  const { t } = useTransClient('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert(t('passwordMismatch'))
      return
    }
    // TODO: Implement registration logic
    console.log('Register:', { email, password })
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>{t('registerAccount')}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder={t('confirmPassword')}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            {t('register')}
          </button>
        </form>
        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            {t('alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}
