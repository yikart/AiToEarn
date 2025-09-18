import { ViralTitle } from "@/api/types/viralTitles";
import styles from "../hotTitle.module.scss";
import HotTitleBackSvg from "../svgs/hotTitleBack.svg";
import Icon from "@ant-design/icons";
import { CSSProperties } from "react";
import { Table, type TableProps, Typography } from "antd";
import hotEventStyles from "../../HotEvent/hotEvent.module.scss";
import hotContentStyles from "../../HotContent/hotContent.module.scss";
import { describeNumber } from "@/utils";

const columns: TableProps<ViralTitle>["columns"] = [
  {
    title: "排名",
    width: 50,
    render: (text, data, ind) => (
      <>
        {ind <= 2 ? (
          <div
            className={hotContentStyles.rankingTopthree}
            style={{ width: "20px", height: "20px", lineHeight: "20px" }}
          >
            {ind + 1}
          </div>
        ) : (
          <p style={{ width: "20px", textAlign: "center" }}>{ind + 1}</p>
        )}
      </>
    ),
  },
  {
    title: "爆款标题",
    render: (text, data, ind) => (
      <div className="hotTitleItem-title">
        <Typography.Paragraph copyable={{ text: data.title }}>
          {data.title}
        </Typography.Paragraph>
      </div>
    ),
  },
  {
    title: "互动量",
    width: 100,
    align: "center",
    render: (text, data, ind) => <>{describeNumber(data.engagement)}</>,
  },
];

export const HotTitleItem = ({
  data,
  style,
  bottomLinkText,
  onBottomLinkClick,
  headRightElement,
}: {
  data: {
    category: string;
    titles: ViralTitle[];
  };
  bottomLinkText: string;
  onBottomLinkClick: () => void;
  style?: CSSProperties;
  headRightElement?: React.ReactNode;
}) => {
  return (
    <div className={styles.hotTitleItem + " hotTitleItem"} style={style}>
      <div className="hotTitleItem-head">
        <div className="hotTitleItem-head-left">
          <div className="hotTitleItem-head-name">{data.category}</div>
          <Icon component={HotTitleBackSvg} />
        </div>
        {headRightElement}
      </div>
      <div
        className={`hotTitleItem-content ${hotEventStyles["hotEvent-item-content"]}`}
      >
        <Table
          dataSource={data.titles}
          columns={columns}
          rowKey={(record) => record._id}
          pagination={false}
          scroll={{ y: 400 }}
          onRow={(record) => {
            return {
              onClick: () => {
                if (!record.url) return;
                window.open(record.url, "_blank");
              },
            };
          }}
        />
        <a
          onClick={(e) => {
            e.preventDefault();
            onBottomLinkClick();
          }}
        >
          {bottomLinkText}
        </a>
      </div>
    </div>
  );
};
