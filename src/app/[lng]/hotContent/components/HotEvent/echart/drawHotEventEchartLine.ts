import * as echarts from "echarts";
import { HotValueHistory } from "@/api/types/hotTopic";
import { describeNumber } from "@/utils";

type EChartsOption = echarts.EChartsOption;

export default function drawHotEventEchartLine(
  elId: string,
  data: HotValueHistory[],
) {
  if (!data || data.length === 0) return;

  const chartDom = document.getElementById(elId)!;
  if (!chartDom) return;
  if (echarts.getInstanceByDom(chartDom)) {
    echarts.dispose(chartDom);
  }
  const myChart = echarts.init(chartDom);

  // 只有一个点时，设置上下各留 50% 空间
  let yMin, yMax;
  if (data.length === 1) {
    const v = data[0].hotValue;
    yMin = v * 0.5;
    yMax = v * 1.5;
  }

  // 处理每个点的颜色
  const seriesData = data.map((item) => {
    if (item.hotValue === null || item.hotValue === undefined) {
      return {
        value: null,
        itemStyle: { color: "#a66ae4" },
      };
    }
    return item.hotValue;
  });

  const option: EChartsOption = {
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    tooltip: {
      trigger: "axis",
      show: true,
      formatter: (params: any) => {
        const item = params[0];
        return `${item.axisValue}<br/>热度值: ${describeNumber(item.data)}`;
      },
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.updateTime),
      show: false,
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      show: false,
      min: yMin,
      max: yMax,
    },
    series: [
      {
        type: "line",
        data: seriesData,
        smooth: true,
        symbol: data.length === 1 ? "circle" : "none",
        symbolSize: 6,
        lineStyle: { width: 2, color: "#a66ae4" },
      },
    ],
  };

  myChart.setOption(option);
}
