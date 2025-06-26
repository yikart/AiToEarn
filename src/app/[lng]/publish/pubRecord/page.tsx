"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./pubRecord.module.scss";
import { apiGetPublishList, PubStatus, AccountType } from "@/api/publish";
import {
  Button,
  Image,
  Select,
  Table,
  TableProps,
  Tag,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import { formatTime } from "@/utils";
import { PubType } from "@/app/config/publishConfig";
import { PubRecordStatusTag } from "@/app/layout/BellMessage";
import {
  ImageView,
  PlatformView,
} from "@/app/[lng]/publish/pubRecord/pubRecord.common";

const { Text, Title } = Typography;

// 发布记录数据模型
export interface PubRecordModel {
  id: number;
  flowId: string;
  type: PubType;
  title: string;
  desc?: string;
  accountId: string;
  accountType: AccountType;
  uid: string;
  videoUrl?: string;
  coverUrl?: string;
  imgList?: string[];
  publishTime: string;
  status: PubStatus;
  option?: any;
  // 兼容原有字段
  coverPath?: string;
  videoPath?: string;
  // 其他不确定的字段使用 any
  [key: string]: any;
}

// 详情弹窗内容组件
const DetailContent = ({ data }: { data: PubRecordModel }) => {
  const renderValue = (key: string, value: any) => {
    // 特殊字段处理
    if (key === "imgList" || key === "imgUrlList") {
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {value.map((url: string, index: number) => (
              <Image
                key={index}
                src={url}
                width={80}
                height={80}
                style={{ objectFit: "cover", borderRadius: "4px" }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              />
            ))}
          </div>
        );
      }
      return <Text type="secondary">无图片</Text>;
    }

    if (key === "videoUrl" || key === "coverUrl") {
      if (value && typeof value === "string") {
        return (
          <div>
            <Text copyable>{value}</Text>
            {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
              <div style={{ marginTop: "8px" }}>
                <Image
                  src={value}
                  width={120}
                  height={80}
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
          </div>
        );
      }
    }

    if (key === "option" && typeof value === "object") {
      return (
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <pre style={{ margin: 0, fontSize: "12px" }}>
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }

    if (key === "publishTime") {
      return <Text>{formatTime(value)}</Text>;
    }

    if (key === "status") {
      return <PubRecordStatusTag status={value} />;
    }

    if (key === "type") {
      const typeMap: Record<string, string> = {
        [PubType.ARTICLE]: "文章发布",
        [PubType.VIDEO]: "视频发布",
        [PubType.ImageText]: "图文发布",
      };
      return <Tag color="blue">{typeMap[value] || "未知类型"}</Tag>;
    }

    if (key === "accountType") {
      return <PlatformView accountType={value} />;
    }

    // 默认处理
    if (typeof value === "object" && value !== null) {
      return (
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <pre style={{ margin: 0, fontSize: "12px" }}>
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }

    return <Text>{String(value)}</Text>;
  };

  const fieldLabels: Record<string, string> = {
    id: "记录ID",
    flowId: "流程ID",
    type: "发布类型",
    title: "标题",
    desc: "描述",
    accountId: "账户ID",
    accountType: "平台类型",
    uid: "用户ID",
    videoUrl: "视频链接",
    coverUrl: "封面链接",
    imgList: "图片列表",
    imgUrlList: "图片链接列表",
    publishTime: "发布时间",
    status: "发布状态",
    option: "发布选项",
    coverPath: "封面路径",
    videoPath: "视频路径",
  };

  return (
    <div style={{ maxHeight: "60vh", overflow: "auto" }}>
      <Descriptions
        column={1}
        bordered
        size="small"
        labelStyle={{ fontWeight: "bold", width: "120px" }}
        contentStyle={{ wordBreak: "break-all" }}
      >
        {Object.entries(data).map(([key, value]) => (
          <Descriptions.Item
            label={fieldLabels[key] || key}
            key={key}
            style={{ padding: "12px" }}
          >
            {renderValue(key, value)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};

// 主页面组件
export default function Page() {
  const [pubRecordList, setPubRecordList] = useState<PubRecordModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [pubType, setPubType] = useState<PubType | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const columns = useMemo(() => {
    const columns: TableProps<PubRecordModel>["columns"] = [
      {
        title: "序号",
        render: (text, prm, ind) => ind + 1,
        width: 70,
        key: "序号",
      },
      {
        title: "发布内容",
        render: (text, prm) => <ImageView prm={prm} width={30} height={50} />,
        width: 200,
        key: "发布内容",
      },
      {
        title: "标题",
        dataIndex: "title",
        key: "title",
        width: 200,
        render: (text) => (
          <div
            style={{
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
        ),
      },
      {
        title: "平台",
        dataIndex: "accountType",
        key: "accountType",
        width: 120,
        render: (text, prm) => <PlatformView accountType={prm.accountType} />,
      },
      {
        title: "发布时间",
        dataIndex: "publishTime",
        key: "publishTime",
        render: (text, prm) => formatTime(prm.publishTime),
        width: 200,
      },
      {
        title: "发布类型",
        dataIndex: "type",
        key: "type",
        render: (_, prm) => {
          switch (prm.type) {
            case PubType.ARTICLE:
              return <>文章发布</>;
            case PubType.VIDEO:
              return <>视频发布</>;
            case PubType.ImageText:
              return <>图文发布</>;
            default:
              return <>未知类型</>;
          }
        },
        width: 120,
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        render: (text, prm) => <PubRecordStatusTag status={prm.status} />,
        width: 100,
      },
      {
        title: "操作",
        width: 100,
        key: "操作",
        render: (text, prm) => (
          <>
            <Button
              type="link"
              onClick={(e) => {
                e.stopPropagation();
                setDetailData(prm);
                setDetailOpen(true);
              }}
            >
              详情
            </Button>
          </>
        ),
      },
    ];
    return columns;
  }, []);

  useEffect(() => {
    getPubList(currentPage);
  }, [pubType, currentPage]);

  async function getPubList(page = currentPage) {
    setLoading(true);
    try {
      const res: any = await apiGetPublishList(page, 10, {
        type: pubType,
      });
      if (res?.data?.list) {
        setPubRecordList(res.data.list);
        setTotalCount(res.data.totalCount || 0);
      } else {
        setPubRecordList([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("获取发布记录失败:", error);
      setPubRecordList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={[styles.pubRecord].join(" ")}>
      {/* 详情弹窗 */}
      <Modal
        open={detailOpen}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Title level={4} style={{ margin: 0 }}>
              发布记录详情
            </Title>
            {detailData && <Tag color="blue">ID: {detailData.id}</Tag>}
          </div>
        }
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {detailData && <DetailContent data={detailData} />}
      </Modal>

      <div className="pubRecord-options">
        <Select
          style={{ width: 120 }}
          placeholder="发布类型"
          allowClear
          value={pubType}
          onChange={(e) => {
            setPubType(e as PubType);
          }}
          options={[
            { value: PubType.ARTICLE, label: "文章" },
            { value: PubType.ImageText, label: "图文" },
            { value: PubType.VIDEO, label: "视频" },
          ]}
        />
      </div>

      <Table<PubRecordModel>
        columns={columns}
        dataSource={pubRecordList}
        scroll={{ y: "70vh" }}
        rowKey="id"
        loading={loading}
        pagination={{
          total: totalCount,
          pageSize: 10,
          current: currentPage,
          showSizeChanger: false,
          showQuickJumper: false,
          onChange: (page) => setCurrentPage(page),
        }}
      />
    </div>
  );
}
