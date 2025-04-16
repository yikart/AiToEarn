import * as echarts from 'echarts';
import { CallbackDataParams } from 'echarts/types/src/util/types';

type EChartsOption = echarts.EChartsOption;

const initWeepPie = (
  chartDom: HTMLDivElement,
  data: {
    value: number;
    name: string;
  }[],
) => {
  if (!chartDom) return;
  const myChart = echarts.init(chartDom);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        params = params as CallbackDataParams;
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = (((params.value as number) / total) * 100).toFixed(2); // 计算百分比并保留两位小数
        return `${params.name}: ${params.value} (${percent}%)`; // 格式化显示文本
      },
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        label: {
          formatter: (params: any) => {
            const total = data.reduce((sum, item) => sum + item.value, 0);
            const percent = ((params.value / total) * 100).toFixed(0); // 百分比
            return `${params.name} ${params.value}(${percent}%) `; // 自定义显示名称、数值和百分比
          },
        },
        data,
      },
    ],
  };

  if (option) myChart.setOption(option);
};

export default initWeepPie;
