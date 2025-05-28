"use client";

import styles from "@/app/styles/page.module.scss";
import React, {useState} from "react";
import {Button, Input} from "antd";

export default function Home() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  return <div className={styles.page}>
    <Input placeholder="手机号" onChange={(e) => setPhone(e.target.value)} />
    <Input placeholder="验证码" onChange={(e) => setCode(e.target.value)} />
    <Button onClick={async () => {
      const req = await fetch(`https://edith.xiaohongshu.com/api/sns/web/v2/login/send_code?phone=${phone}&zone=86&type=login`, {
        method: 'GET',
        headers: {
          origin: 'https://www.xiaohongshu.com',
          referer: "https://www.xiaohongshu.com/"
        }
      })
      const res = await req.json();
      console.log(res)
    }}>发送验证码</Button>
    <Button onClick={() => {

    }}>登录</Button>
  </div>;
}
