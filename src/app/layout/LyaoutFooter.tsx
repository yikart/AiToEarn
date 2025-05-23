import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./styles/lyaoutFooter.module.scss";
import Image from "next/image";
import Link from "next/link";
import QRCode1 from "./images/QRCode1.jpg";
import QRCode2 from "./images/QRCode2.png";
import { useTranslation } from "@/app/i18n";

export interface ILyaoutFooterRef {}

export interface ILyaoutFooterProps {
  lng: string;
}

function getLinkList() {
  return [
    {
      name: "新华网",
      link: "http://www.news.cn",
    },
    {
      name: "财经网",
      link: "https://www.caijing.com.cn",
    },
    {
      name: "腾讯网",
      link: "https://www.qq.com",
    },
  ];
}

const LyaoutFooter = memo(
  forwardRef(
    async (
      { lng }: ILyaoutFooterProps,
      ref: ForwardedRef<ILyaoutFooterRef>,
    ) => {
      const linkList = getLinkList();
      const { t } = await useTranslation(lng);

      return (
        <div className={styles.layoutFooter}>
          <div className={styles.layoutFooter_wrapper}>
            <div className={styles["layoutFooter_wrapper-left"]}>
              <h2>{t("title")}</h2>
              <p>
                <a
                  href="https://beian.miit.gov.cn/#/Integrated/recordQuery"
                  target="_blank"
                >
                  Copyright@2020艺咖（北京）科技有限公司 京ICP备19059131号-1
                </a>
              </p>
            </div>
            <div className={styles["layoutFooter_wrapper-center"]}>
              <h3>友情链接</h3>
              <ul>
                {linkList.map((item, i) => (
                  <li key={i}>
                    <Link href={item.link} target="_blank">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <ul className={styles["layoutFooter_wrapper-right"]}>
              <li>
                <Image src={QRCode1} alt="商务合作" width={88} />
                <p>商务合作</p>
              </li>
              <li>
                <Image src={QRCode2} alt="公众号" width={88} />
                <p>公众号</p>
              </li>
            </ul>
          </div>
        </div>
      );
    },
  ),
);

export default LyaoutFooter;
