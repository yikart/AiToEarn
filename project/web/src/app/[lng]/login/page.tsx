'use client'

import { GoogleLogin } from '@react-oauth/google'
import { Button, Form, Input, message, Modal } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  checkRegistStatusApi,
  getRegistUrlApi,
  googleLoginApi,
  GoogleLoginParams,
  loginWithMailApi,
  mailRegistApi,
} from '@/api/apiReq'
import { useTransClient } from '@/app/i18n/client'
import { useUserStore } from '@/store/user'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { setToken, setUserInfo } = useUserStore()
  const { t } = useTransClient('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [registCode, setRegistCode] = useState('')
  const [form] = Form.useForm()
  const [isActivating, setIsActivating] = useState(false)
  const [activationTimer, setActivationTimer] = useState<NodeJS.Timeout | null>(null)
  const [registUrl, setRegistUrl] = useState('')
  const [showRegistModal, setShowRegistModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await loginWithMailApi({ mail: email, password })
      if (!response)
        return

      if (response.code === 0) {
        if (response.data.type === 'regist') {
          // User not registered, show modal prompt and set default password value for form
          setRegistCode(response.data.code || '')
          form.setFieldsValue({ password }) // Set default value for password field
          setIsModalOpen(true)
          setIsChecking(true)
        }
        else if (response.data.token) {
          // Login successful
          setToken(response.data.token)
          if (response.data.userInfo) {
            setUserInfo(response.data.userInfo)
          }
          message.success(t('loginSuccess'))
          router.push('/accounts')
        }
      }
      else {
        message.error(response.message || t('loginFailed'))
      }
    }
    catch (error) {
      message.error(t('loginError'))
    }
  }

  const handleRegistSubmit = async (values: { password: string, code: string, inviteCode?: string }) => {
    try {
      setIsActivating(true)

      const response = await mailRegistApi({
        mail: email,
        code: values.code,
        password: values.password,
        inviteCode: values.inviteCode || '',
      })

      if (!response) {
        message.error(t('registerError'))
        setIsActivating(false)
        return
      }

      if (response.code === 0 && response.data.token) {
        // Registration successful
        setIsActivating(false)
        setIsModalOpen(false)
        form.resetFields() // Reset form
        setToken(response.data.token)
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo)
        }
        message.success(t('registerSuccess'))
        router.push('/accounts')
      }
      else {
        message.error(response.message || t('registerError'))
        setIsActivating(false)
      }
    }
    catch (error) {
      message.error(t('registerError'))
      setIsActivating(false)
    }
  }

  // Clear timer when component unmounts
  useEffect(() => {
    return () => {
      if (activationTimer) {
        clearInterval(activationTimer)
      }
    }
  }, [activationTimer])

  const handleGoogleSuccess = async (credentialResponse: any) => {
    console.log('credentialResponse', credentialResponse)

    try {
      const params: any = {
        platform: 'google',
        clientId: credentialResponse.clientId,
        credential: credentialResponse.credential,
      }

      const response: any = await googleLoginApi(params)
      console.log('login response', response)
      if (!response) {
        message.error(t('googleLoginFailed'))
        return
      }

      if (response.code === 0) {
        if (response.data.type === 'login') {
          // Direct login successful
          setToken(response.data.token)
          if (response.data.userInfo) {
            setUserInfo(response.data.userInfo)
          }
          message.success(t('loginSuccess'))
          router.push('/accounts')
        }
      }
      else {
        message.error(response.message || t('googleLoginFailed'))
      }
    }
    catch (error) {
      message.error(t('googleLoginFailed'))
    }
  }

  const handleGoogleError = () => {
    console.log(t('googleLoginFailed'))
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>{t('welcomeBack')}</h1>
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
          <Button type="primary" htmlType="submit" block className={styles.submitButton}>
            {t('login')}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>{t('or')}</span>
        </div>

        <div className={styles.googleButtonWrapper}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            shape="rectangular"
            text="signin_with"
            locale="zh_CN"
            width="100%"
            size="large"
          />
        </div>

        <div className={styles.links}>
          <Link href="/forgot-password" className={styles.link}>
            {t('forgotPassword')}
          </Link>
        </div>
      </div>

      <Modal
        title={t('completeRegistration')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setIsChecking(false)
          setIsActivating(false)
          form.resetFields() // Reset form
          if (activationTimer) {
            clearInterval(activationTimer)
          }
        }}
        maskClosable={false}
        keyboard={false}
        closable={true}
        footer={null}
        className={styles.modalWrapper}
      >
        <Form
          form={form}
          onFinish={handleRegistSubmit}
          layout="vertical"
        >
          <Form.Item
            label={t('emailCode')}
            name="code"
            rules={[
              { required: true, message: t('emailCodeRequired') },
              { len: 6, message: t('emailCodeLength') },
            ]}
          >
            <Input placeholder={t('enterEmailCode')} maxLength={6} />
          </Form.Item>

          <Form.Item
            label={t('setPassword')}
            name="password"
            rules={[
              { required: true, message: t('passwordRequired') },
              { min: 6, message: t('passwordMinLength') },
            ]}
          >
            <Input.Password placeholder={t('enterPassword')} />
          </Form.Item>

          <Form.Item
            label={t('inviteCode')}
            name="inviteCode"
          >
            <Input placeholder={t('enterInviteCode')} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isActivating}
            >
              {isActivating ? t('registering') : t('completeRegistration')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
