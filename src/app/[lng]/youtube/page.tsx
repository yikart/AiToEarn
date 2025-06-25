"use client";

import React, { useState, useEffect } from "react";
import { useTransClient } from "@/app/i18n/client";
import { Button, Input, message, Card, Upload, Select, Alert } from "antd";
import {
  MailOutlined,
  YoutubeOutlined,
  CheckOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  getYouTubeAuthUrlApi,
  checkYouTubeAuthApi,
  uploadYouTubeVideoApi,
  getYouTubeChannelSectionsApi,
} from "@/api/youtube";
import styles from "./youtube.module.css";

const YouTubeAuth: React.FC = () => {
  const { t } = useTransClient("youtube");
  const [email, setEmail] = useState("zhang7676533317@gmail.com");
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [hasChannel, setHasChannel] = useState(false);

  // 获取频道分区
  const fetchChannelSections = async () => {
    try {
      const response: any = await getYouTubeChannelSectionsApi({
        accountId: "117748783778429701407",
        mine: true,
      });
      if (response?.data?.items?.length > 0) {
        setHasChannel(true);
        setSections(response.data.items);
      } else {
        setHasChannel(false);
        setSections([]);
      }
    } catch (error) {
      console.error("获取频道分区失败:", error);
      setHasChannel(false);
    }
  };

  // 当授权状态改变时获取分区
  useEffect(() => {
    if (isAuthorized) {
      fetchChannelSections();
    }
  }, [isAuthorized]);

  const handleCheck = async () => {
    if (!email) {
      message.error(t("pleaseEnterEmail"));
      return;
    }

    setCheckLoading(true);
    try {
      const response = await checkYouTubeAuthApi({
        accountId: "684e21724e694186e5b61b59",
      });

      if (response?.data) {
        message.success(t("alreadyAuthorized"));
        setIsAuthorized(true);
      } else {
        message.info(t("notAuthorized"));
      }
    } catch (error) {
      console.error("检查授权状态失败:", error);
      message.error(t("checkFailed"));
    } finally {
      setCheckLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email) {
      message.error(t("pleaseEnterEmail"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.error(t("invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      const response = await getYouTubeAuthUrlApi(email);
      if (response?.data) {
        // @ts-ignore
        window.open(response.data?.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("获取授权 URL 失败:", error);
      message.error(t("authFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!isAuthorized) {
      message.error(t("notAuthorized"));
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", "117748783778429701407");
      formData.append("title", "你说这怎么样");
      formData.append("description", "糟糕啊，是心动的感觉！");
      formData.append("privacyStatus", "private");
      if (selectedSection) {
        formData.append("sectionId", selectedSection);
      }

      const response = await uploadYouTubeVideoApi(formData);
      if (response?.data) {
        message.success(t("uploadSuccess"));
      } 
    } catch (error) {
      console.error("上传视频失败:", error);
      message.error(t("uploadFailed"));
    } finally {
      setUploadLoading(false);
    }
    return false;
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} bodyStyle={{ padding: "2.5rem" }}>
        <div className={styles.header}>
          <YoutubeOutlined className={styles.icon} />
          <h2 className={styles.title}>{t("youtubeAuth")}</h2>
          <p className={styles.description}>{t("authDescription")}</p>
        </div>

        <div className={styles.form}>
          <div className={styles.formItem}>
            <label htmlFor="email" className={styles.label}>
              {t("email")}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              size="large"
              className={styles.input}
              placeholder={t("enterEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<MailOutlined className={styles.inputIcon} />}
            />
          </div>

          <div className={styles.buttonGroup}>
            <Button
              type="default"
              size="large"
              onClick={handleCheck}
              loading={checkLoading}
              className={styles.checkButton}
              icon={<CheckOutlined />}
            >
              {t("checkAuth")}
            </Button>

            <Button
              type="primary"
              size="large"
              onClick={handleAuth}
              loading={loading}
              className={styles.button}
              icon={<YoutubeOutlined />}
            >
              {t("authorize")}
            </Button>
          </div>

          <div className={styles.uploadSection}>
            {isAuthorized && !hasChannel && (
              <Alert
                message="您还没有 YouTube 频道"
                description={
                  <div>
                    <p>请先创建 YouTube 频道后再上传视频</p>
                    <Button
                      type="primary"
                      onClick={() =>
                        window.open(
                          "https://www.youtube.com/create_channel",
                          "_blank",
                        )
                      }
                      className={styles.createChannelButton}
                    >
                      创建频道
                    </Button>
                  </div>
                }
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                className={styles.alert}
              />
            )}

            {isAuthorized && hasChannel && sections.length > 0 && (
              <Select
                className={styles.sectionSelect}
                placeholder="选择频道分区"
                value={selectedSection}
                onChange={setSelectedSection}
                options={sections.map((section: any) => ({
                  label: section.title,
                  value: section.id,
                }))}
              />
            )}

            <Upload
              accept="video/*"
              showUploadList={false}
              beforeUpload={handleUpload}
              disabled={!isAuthorized || !hasChannel || uploadLoading}
            >
              <Button
                type="primary"
                size="large"
                loading={uploadLoading}
                className={styles.uploadButton}
                icon={<UploadOutlined />}
                disabled={!isAuthorized || !hasChannel}
              >
                {t("uploadVideo")}
              </Button>
            </Upload>
            {!isAuthorized && (
              <p className={styles.uploadTip}>{t("needAuthFirst")}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default YouTubeAuth;
