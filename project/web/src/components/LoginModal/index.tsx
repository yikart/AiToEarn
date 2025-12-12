'use client'

import { GoogleLogin } from '@react-oauth/google'
import { Button, Form, Input, message, Modal } from 'antd'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
  googleLoginApi,
  loginWithMailApi,
  mailRegistApi,
} from '@/api/apiReq'
import { useTransClient } from '@/app/i18n/client'
import { useUserStore } from '@/store/user'
import loginStyles from '@/app/[lng]/login/login.module.css'

interface LoginModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void // 登录成功后的回调
}

export default function LoginModal({ open, onCancel, onSuccess }: LoginModalProps) {
  const { t: tLogin } = useTransClient('login')
  const { lng } = useParams()
  const { setToken, setUserInfo } = useUserStore()
  
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [registCode, setRegistCode] = useState('')
  const [loginForm] = Form.useForm()
  const [isActivating, setIsActivating] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await loginWithMailApi({ mail: loginEmail, password: loginPassword })
      if (!response) return

      if (response.code === 0) {
        if (response.data.type === 'regist') {
          // User not registered, show registration modal
          setRegistCode(response.data.code || '')
          loginForm.setFieldsValue({ password: loginPassword })
          setIsModalOpen(true)
        } else if (response.data.token) {
          // Login successful
          setToken(response.data.token)
          if (response.data.userInfo) {
            setUserInfo(response.data.userInfo)
          }
          message.success(tLogin('loginSuccess'))
          onCancel()
          onSuccess?.()
        }
      } else {
        message.error(response.message || tLogin('loginFailed'))
      }
    } catch (error) {
      message.error(tLogin('loginError'))
    }
  }

  const handleRegistSubmit = async (values: { password: string, code: string, inviteCode?: string }) => {
    try {
      setIsActivating(true)
      const response = await mailRegistApi({
        mail: loginEmail,
        code: values.code,
        password: values.password,
        inviteCode: values.inviteCode || '',
      })

      if (!response) {
        message.error(tLogin('registerError'))
        setIsActivating(false)
        return
      }

      if (response.code === 0 && response.data.token) {
        setIsActivating(false)
        setIsModalOpen(false)
        loginForm.resetFields()
        setToken(response.data.token)
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo)
        }
        message.success(tLogin('registerSuccess'))
        onCancel()
        onSuccess?.()
      } else {
        message.error(response.message || tLogin('registerError'))
        setIsActivating(false)
      }
    } catch (error) {
      message.error(tLogin('registerError'))
      setIsActivating(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const params: any = {
        platform: 'google',
        clientId: credentialResponse.clientId,
        credential: credentialResponse.credential,
      }

      const response: any = await googleLoginApi(params)
      if (!response) {
        message.error(tLogin('googleLoginFailed'))
        return
      }

      if (response.code === 0 && response.data.type === 'login') {
        setToken(response.data.token)
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo)
        }
        message.success(tLogin('loginSuccess'))
        onCancel()
        onSuccess?.()
      } else {
        message.error(response.message || tLogin('googleLoginFailed'))
      }
    } catch (error) {
      message.error(tLogin('googleLoginFailed'))
    }
  }

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={460}
        centered
        destroyOnClose
      >
        <div className={loginStyles.loginBox} style={{ boxShadow: 'none', padding: '24px 0' }}>
          <h1 className={loginStyles.title}>{tLogin('welcomeBack')}</h1>
          <form onSubmit={handleLoginSubmit} className={loginStyles.form}>
            <div className={loginStyles.inputGroup}>
              <input
                type="email"
                placeholder={tLogin('emailPlaceholder')}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className={loginStyles.input}
                required
              />
            </div>
            <div className={loginStyles.inputGroup}>
              <input
                type="password"
                placeholder={tLogin('passwordPlaceholder')}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className={loginStyles.input}
                required
              />
            </div>
            <Button type="primary" htmlType="submit" block className={loginStyles.submitButton}>
              {tLogin('login')}
            </Button>
          </form>

          <div className={loginStyles.divider}>
            <span>{tLogin('or')}</span>
          </div>

          <div className={loginStyles.googleButtonWrapper}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => message.error(tLogin('googleLoginFailed'))}
              useOneTap={false}
              theme="outline"
              shape="rectangular"
              text="signin_with"
              locale={lng === 'zh-CN' ? 'zh_CN' : 'en'}
              width="100%"
              size="large"
            />
          </div>
        </div>
      </Modal>

      {/* Registration Modal */}
      <Modal
        title={tLogin('completeRegistration')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setIsActivating(false)
          loginForm.resetFields()
        }}
        maskClosable={false}
        keyboard={false}
        closable={true}
        footer={null}
        className={loginStyles.modalWrapper}
      >
        <Form
          form={loginForm}
          onFinish={handleRegistSubmit}
          layout="vertical"
        >
          <Form.Item
            label={tLogin('emailCode')}
            name="code"
            rules={[
              { required: true, message: tLogin('emailCodeRequired') },
              { len: 6, message: tLogin('emailCodeLength') },
            ]}
          >
            <Input placeholder={tLogin('enterEmailCode')} maxLength={6} />
          </Form.Item>

          <Form.Item
            label={tLogin('setPassword')}
            name="password"
            rules={[
              { required: true, message: tLogin('passwordRequired') },
              { min: 6, message: tLogin('passwordMinLength') },
            ]}
          >
            <Input.Password placeholder={tLogin('enterPassword')} />
          </Form.Item>

          <Form.Item
            label={tLogin('inviteCode')}
            name="inviteCode"
          >
            <Input placeholder={tLogin('enterInviteCode')} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isActivating}
            >
              {isActivating ? tLogin('registering') : tLogin('completeRegistration')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

