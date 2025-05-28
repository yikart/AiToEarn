"use client";

import styles from "@/app/styles/page.module.scss";
import React, {useEffect, useRef, useState} from "react";
import { Button, Input } from "antd";

// 等待n毫秒
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [qsImg, setQsImg] = useState("");
  const flag = useRef(false);

  useEffect(() => {
    (async () => {
      if (flag.current) return;
      flag.current = true;
      const req = await fetch(
        `https://platapi.yikart.cn/api/xhs/login_qr_code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
          },
        },
      );
      const res = await req.json();
      setQsImg(
        "data:image/png;base64," + res.data.response_body.data.base64_qr_code,
      );
      document.cookie = res.data.response_body.data.cookie;
      // console.log()

      while (true) {
        const req2 = await fetch(
          `https://platapi.yikart.cn/api/xhs/check_login`,
          {
            method: "POST",
            // headers: {
            //   "Content-Type": "application/json",
            // },
            body: JSON.stringify({
              code: res.data.response_body.data.code,
              qr_id: res.data.response_body.data.qr_id,
              cookie: res.data.response_body.data.cookie,
            }),
          },
        );
        await sleep(3000);
        const res2 = await req2.json();
        if (res2.data.response_body.data.code_status === 2) {
          console.log(res.data.response_body.data);
          break;
        }
      }
    })();
  }, []);

  return (
    <div className={styles.page}>
      <img src={qsImg} />

      <Input placeholder="手机号" onChange={(e) => setPhone(e.target.value)} />
      <Input placeholder="验证码" onChange={(e) => setCode(e.target.value)} />
      <Button
        onClick={async () => {
          const req = await fetch(`/xhsXS/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify({
              url: `/api/sns/web/v2/login/send_code?phone=${phone}&zone=86&type=login`,
              cookie: document.cookie,
            }),
          });
          const xsRes = await req.json();

          const req1 = await fetch(
            `/xiaohongshu/sns/web/v2/login/send_code?phone=${phone}&zone=86&type=login`,
            {
              method: "GET",
              headers: {
                "x-s":
                  "XYS_2UQhPsHCH0c1PjhIHjIj2erjwjQhyoPTqBPT49pjHjIj2eHjwjQgynEDJ74AHjIj2ePjwjQTJdPIP/ZlgMrU4SmH4ebwGFqE4pzEzrk9weHMnLMea0zH4Dk0//W3PMrUaDMeGnMzJgkO+gz+GdiI/9RynBRYzAZF8fuI/DSMG/zC+LkPaoW7cMP6PMkB+fS98Dl9N9FM+/zS+A8CnpP78BRdGMkxJBbS8omec0bfaLz3PrlhwnEhyLTIGnkeaDzPLnkSP7G38fT64A8j+dmTzflfLBT6+L+0zMb8+7zS4BL98fTfPBY+HjIj2ecjwjHjKc==",
              },
            },
          );
          console.log(req1);

          // const req = await fetch(
          //   `https://platapi.yikart.cn/api/xhs/send_code`,
          //   {
          //     method: "POST",
          //     body: JSON.stringify({
          //       mobile: phone,
          //     }),
          //   },
          // );
          const res = await req.json();
          console.log(res);
        }}
      >
        发送验证码
      </Button>
      <Button
        onClick={async () => {
          const req = await fetch(`/xhsXS/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify({
              url: `/api/sns/web/v1/login/check_code?phone=17600917357&zone=86&code=123`,
              a1: `a1=1953cfa200duqccg24dtw9u1y7ubred8l9iyg1y0150000466896; webId=76f7ec5c74e78c5756fabe7b987c66bf; gid=yj2qSi0JD41Syj2qSi0J8jyv8f7ASSkJ4f9E38yj7yvW7v28DFdfYk8884KKYjK8qWDiq08i; customerClientId=412120289436764; abRequestId=76f7ec5c74e78c5756fabe7b987c66bf; x-user-id-ad-market.xiaohongshu.com=678df12c0000000004030ab9; x-user-id-creator.xiaohongshu.com=682851d50000000007000633; webBuild=4.64.0; customer-sso-sid=68c517509396918886050316tyy59dfmmpqjfyuw; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517509396918886366307e9ezes1g34kgpku9; galaxy_creator_session_id=PljCqPggTFa0xI1sODUoiGq1qTakQPVXYthl; galaxy.creator.beaker.session.id=1748417718742000985340; xsecappid=xhs-pc-web; web_session=030037a0f3697c3b8debfc944e2f4a079bd40a; acw_tc=0a4adcd017484235263232839e9108cd2acbb581623e024122e2088ccbe8fe; websectiga=a9bdcaed0af874f3a1431e94fbea410e8f738542fbb02df1e8e30c29ef3d91ac; sec_poison_id=9ea1d95c-e767-4e55-8729-1ed51458d67e; loadts=1748424559788; unread={%22ub%22:%2268118988000000001201c272%22%2C%22ue%22:%2268169150000000002101ad9a%22%2C%22uc%22:29}`,
            }),
          });

          const xsRes = await req.json();
          const req2 = await fetch(
            `/xiaohongshu/sns/web/v1/login/check_code?phone=${phone}&zone=86&code=${code}`,
            {
              method: "GET",
              headers: {
                "x-s": xsRes["X-s"],
              },
            },
          );

          const req3 = await fetch(`/xiaohongshu/sns/web/v2/login/code`, {
            method: "POST",
            headers: {},
          });
        }}
      >
        登录
      </Button>
    </div>
  );
}
