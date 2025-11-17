'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './register.module.css'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      return
    }
    // TODO: 实现注册逻辑
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>register account</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            register
          </button>
        </form>
        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            already have an account? login
          </Link>
        </div>
      </div>
    </div>
  )
}
