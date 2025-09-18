import { ViralTitle } from "@/api/types/viralTitles";
import styles from "../hotTitle.module.scss";
import HotTitleBackSvg from "../svgs/hotTitleBack.svg";
import Icon from "@ant-design/icons";
import { CSSProperties } from "react";
import { Table, type TableProps } from "antd";
import hotEventStyles from "../../HotEvent/hotEvent.module.scss";
import hotContentStyles from "../../HotContent/hotContent.module.scss";

const columns: TableProps<ViralTitle>["columns"] = [
  {
    title: "排名",
    width: 60,
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
];

export const HotTitleItem = ({
  data,
  style,
}: {
  data: {
    category: string;
    titles: ViralTitle[];
  };
  style?: CSSProperties;
}) => {
  return (
    <div className={styles.hotTitleItem} style={style}>
      <div className="hotTitleItem-head">
        <div className="hotTitleItem-head-name">{data.category}</div>
        <Icon component={HotTitleBackSvg} />
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
        />
      </div>
    </div>
  );
};
