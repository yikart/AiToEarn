"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Input, Button, Select, Spin, Tabs } from "antd";
import { ArrowLeftOutlined, RobotOutlined, FireOutlined, PictureOutlined, FileTextOutlined } from "@ant-design/icons";
import styles from "./ai-generate.module.scss";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export default function AIGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.id as string;

  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [temp, setTemp] = useState("tempA");
  const [loadingFirefly, setLoadingFirefly] = useState(false);
  const [fireflyResult, setFireflyResult] = useState<string | null>(null);

  const handleTextToImage = async () => {
    if (!prompt) {
      message.error("请输入提示词");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/tools/ai/jm/task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          width,
          height,
          sessionIds,
        }),
      });

      const data = await response.json();
      if (data.id) {
        setTaskId(data.id);
        setPolling(true);
        pollTaskResult(data.id);
      } else {
        message.error("生成任务创建失败");
      }
    } catch (error) {
      message.error("生成任务创建失败");
    } finally {
      setLoading(false);
    }
  };

  const pollTaskResult = async (id: string) => {
    try {
      const response = await fetch(`/tools/ai/jm/task/${id}`);
      const data = await response.json();
      if (data.status === "completed") {
        setResult(data.result);
        setPolling(false);
      } else if (data.status === "failed") {
        message.error("生成任务失败");
        setPolling(false);
      } else {
        setTimeout(() => pollTaskResult(id), 1000);
      }
    } catch (error) {
      message.error("获取任务结果失败");
      setPolling(false);
    }
  };

  const handleTextToFireflyCard = async () => {
    if (!content || !title) {
      message.error("请输入内容和标题");
      return;
    }

    try {
      setLoadingFirefly(true);
      const response = await fetch("/tools/ai/fireflycard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          temp,
          title,
        }),
      });

      const data = await response.json();
      if (data.url) {
        setFireflyResult(data.url);
      } else {
        message.error("生成流光卡片失败");
      }
    } catch (error) {
      message.error("生成流光卡片失败");
    } finally {
      setLoadingFirefly(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeftOutlined />
          </button>
          <p><RobotOutlined /> AI生成素材</p>
        </div>
      </div>

      <div className={styles.content}>
        <Tabs defaultActiveKey="textToImage" className={styles.tabs}>
          <TabPane 
            tab={
              <span>
                <PictureOutlined /> 文生图
              </span>
            } 
            key="textToImage"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <TextArea
                  placeholder="请输入提示词"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <div className={styles.dimensions}>
                  <Input
                    type="number"
                    placeholder="宽度"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    placeholder="高度"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                  />
                </div>
                <Button
                  type="primary"
                  onClick={handleTextToImage}
                  loading={loading}
                  disabled={!prompt}
                  icon={<PictureOutlined />}
                >
                  生成图片
                </Button>
              </div>
              {polling && (
                <div className={styles.polling}>
                  <Spin tip="正在生成图片，请稍候..." />
                </div>
              )}
              {result && (
                <div className={styles.result}>
                  <img src={result} alt="生成的图片" />
                </div>
              )}
            </div>
          </TabPane>
          <TabPane 
            tab={
              <span>
                <FireOutlined /> 文生图文（流光卡片）
              </span>
            } 
            key="textToFireflyCard"
          >
            <div className={styles.section}>
              <div className={styles.form}>
                <Input
                  placeholder="请输入标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  prefix={<FileTextOutlined />}
                />
                <TextArea
                  placeholder="请输入内容"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
                <Select
                  value={temp}
                  onChange={setTemp}
                  style={{ width: "100%" }}
                >
                  <Option value="tempA">模板A</Option>
                  <Option value="tempB">模板B</Option>
                  <Option value="tempC">模板C</Option>
                </Select>
                <Button
                  type="primary"
                  onClick={handleTextToFireflyCard}
                  loading={loadingFirefly}
                  disabled={!content || !title}
                  icon={<FireOutlined />}
                >
                  生成流光卡片
                </Button>
              </div>
              {fireflyResult && (
                <div className={styles.result}>
                  <img src={fireflyResult} alt="生成的流光卡片" />
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
} 