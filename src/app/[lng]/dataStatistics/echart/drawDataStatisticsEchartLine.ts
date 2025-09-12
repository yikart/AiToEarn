import * as echarts from "echarts";
import { useDataStatisticsStore } from "../useDataStatistics"; // 引入store

type EChartsOption = echarts.EChartsOption;

export default function drawDataStatisticsEchartLine(elId: string) {
  const chartDom = document.getElementById(elId)!;
  // 先销毁已有实例，防止重复初始化报错
  if (echarts.getInstanceByDom(chartDom)) {
    echarts.dispose(chartDom);
  }
  const myChart = echarts.init(chartDom);

  // 获取store中的echartData
  const { legend, xAxis, series } =
    useDataStatisticsStore.getState().echartData;

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      top: 25,
      data: legend,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xAxis,
    },
    yAxis: {
      type: "value",
    },
    // @ts-ignore
    series: series,
  };

  if (option) {
    myChart.setOption(option);
  }
}
