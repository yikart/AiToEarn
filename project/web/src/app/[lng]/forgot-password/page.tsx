'use client'

import { Button, Form, Input, message, Modal } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { resetPasswordApi, sendResetPasswordMailApi } from '@/api/apiReq'
import { useTransClient } from '@/app/i18n/client'
import styles from './forgot-password.module.css'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useTransClient('login')
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resetForm] = Form.useForm()

  // 处理Modal关闭
  const handleModalClose = () => {
    setIsModalOpen(false)
    resetForm.resetFields()
  }

  // 处理发送重置密码邮件
  const handleSubmit = async (values: { mail: string }) => {
    try {
      setLoading(true)
      const response: any = await sendResetPasswordMailApi(values)

      if (response.code === 0) {
        message.success(t('resetEmailSent' as any))
        setIsModalOpen(true)
      }
    }
    catch (error) {
      message.error(t('sendEmailFailed' as any))
    }
    finally {
      setLoading(false)
    }
  }

  // 处理重置密码
  const handleResetPassword = async (values: { code: string, password: string }) => {
    try {
      setLoading(true)
      const response: any = await resetPasswordApi({
        code: values.code,
        mail: form.getFieldValue('mail'),
        password: values.password,
      })

      if (response.code === 0) {
        message.success(t('resetSuccess' as any))
        setIsModalOpen(false)
        router.push('/login')
      }
    }
    catch (error) {
      message.error(t('resetFailed' as any))
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>{t('resetPassword' as any)}</h1>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="mail"
            label={t('emailLabel' as any)}
            rules={[
              { required: true, message: t('emailRequired' as any) },
              { type: 'email', message: t('emailInvalid' as any) },
            ]}
          >
            <Input placeholder={t('emailPlaceholder' as any)} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className={styles.submitButton}
            >
              {t('sendResetLink' as any)}
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            {t('backToLogin' as any)}
          </Link>
        </div>
      </div>

      <Modal
        title={t('resetPassword' as any)}
        open={isModalOpen}
        onCancel={handleModalClose}
        maskClosable={false}
        footer={null}
      >
        <Form
          form={resetForm}
          onFinish={handleResetPassword}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label={t('verificationCode' as any)}
            rules={[
              { required: true, message: t('verificationCodeRequired' as any) },
            ]}
          >
            <Input placeholder={t('verificationCodePlaceholder' as any)} />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('newPassword' as any)}
            rules={[
              { required: true, message: t('newPasswordRequired' as any) },
              { min: 6, message: t('newPasswordMinLength' as any) },
            ]}
          >
            <Input.Password placeholder={t('newPasswordPlaceholder' as any)} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('confirmPassword' as any)}
            dependencies={['password']}
            rules={[
              { required: true, message: t('confirmPasswordRequired' as any) },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('confirmPasswordMismatch' as any)))
                },
              }),
            ]}
          >
            <Input.Password placeholder={t('confirmPasswordPlaceholder' as any)} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className={styles.submitButton}
            >
              {t('confirmReset' as any)}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
