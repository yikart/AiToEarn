import { Statistic } from 'antd'
import { useRef, useState } from 'react'
import styles from './getCode.module.scss'

const { Timer } = Statistic

function GetCode({
  onGetCode,
  codeSendTime = 60,
}: {
  onGetCode: (unlock: () => void) => void
  codeSendTime?: number
}) {
  const [isCode, setIsCode] = useState(false)
  const currTime = useRef(0)

  const lockCode = () => {
    setIsCode(true)
    currTime.current = codeSendTime * 1000
  }

  return (
    <label
      className={
        `${styles['loginForm-getCode']
        } ${isCode ? styles['loginForm-getCode--disable'] : ''}`
      }
      onClick={() => {
        if (isCode)
          return
        lockCode()
        onGetCode(() => {
          setIsCode(false)
        })
      }}
    >
      获取验证码
      {isCode
        ? (
            <>
              （
              <Timer
                type="countdown"
                format="ss"
                value={Date.now() + currTime.current}
                precision={1}
                onFinish={() => {
                  setIsCode(false)
                }}
                onChange={(e) => {
                  if (typeof e === 'number') {
                    currTime.current = e
                  }
                }}
              />
              s）
            </>
          )
        : (
            ''
          )}
    </label>
  )
}

export default GetCode
