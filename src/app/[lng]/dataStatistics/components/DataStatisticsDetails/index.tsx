import { ForwardedRef, forwardRef, memo } from "react";
import styles from "./dataStatisticsDetails.module.scss";
import { useDataStatisticsStore } from "@/app/[lng]/dataStatistics/useDataStatistics";
import { useShallow } from "zustand/react/shallow";
import Icon from "@ant-design/icons";

export interface IDataStatisticsDetailsRef {}

export interface IDataStatisticsDetailsProps {}

const DataStatisticsDetails = memo(
  forwardRef(
    (
      {}: IDataStatisticsDetailsProps,
      ref: ForwardedRef<IDataStatisticsDetailsRef>,
    ) => {
      const { currentDetailType, dataDetails, setCurrentDetailType } =
        useDataStatisticsStore(
          useShallow((state) => ({
            dataDetails: state.dataDetails,
            currentDetailType: state.currentDetailType,
            setCurrentDetailType: state.setCurrentDetailType,
          })),
        );

      return (
        <div className={styles.dataStatisticsDetails}>
          <h3>数据明细</h3>

          <div className="dataStatisticsDetails-content">
            {dataDetails.map((detail) => (
              <div
                key={detail.value}
                className={`dataStatisticsDetails-content-item ${
                  currentDetailType === detail.value
                    ? "dataStatisticsDetails-content-item--active"
                    : ""
                }`}
                onClick={() => {
                  setCurrentDetailType(detail.value);
                }}
              >
                <p className="dataStatisticsDetails-content-item-title">
                  <span className="dataStatisticsDetails-content-item-icon">
                    <Icon component={detail.icon} />
                  </span>
                  {detail.title}
                </p>
                <p className="dataStatisticsDetails-content-item-count">
                  {detail.total}
                </p>
                <p className="dataStatisticsDetails-content-item-yesterday">
                  昨日新增
                  <b>{detail.yesterday}</b>
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    },
  ),
);

export default DataStatisticsDetails;
