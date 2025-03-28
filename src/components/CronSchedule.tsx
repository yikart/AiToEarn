import { useState, useEffect } from 'react';
import { Select, Input, Button, message, Form } from 'antd';

interface CronScheduleProps {
  onSubmit: (cronExpression: string) => void;
}

const CronSchedule: React.FC<CronScheduleProps> = ({ onSubmit }) => {
  const [selectedType, setSelectedType] = useState('day');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setValue(''); // 切换类型时重置输入值
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = () => {
    if (validate()) {
      const cronExpression = `${selectedType}-${value}`;
      onSubmit(cronExpression);
      message.success('定时表达式生成成功');
    }
  };

  const validate = (): boolean => {
    let isValid = true;
    let errorMessage = '';
    const valueInt = parseInt(value, 10);

    switch (selectedType) {
      case 'day':
        if (isNaN(valueInt) || valueInt < 0 || valueInt > 23) {
          errorMessage = '小时必须是0-23的整数';
          isValid = false;
        }
        break;
      case 'week':
        if (isNaN(valueInt) || valueInt < 0 || valueInt > 6) {
          errorMessage = '周必须是0（周日）到6（周六）的整数';
          isValid = false;
        }
        break;
      case 'month':
        if (isNaN(valueInt) || valueInt < 1 || valueInt > 31) {
          errorMessage = '日期必须是1-31的整数';
          isValid = false;
        }
        break;
      default:
        isValid = false;
    }

    setError(errorMessage);
    return isValid;
  };

  return (
    <Form layout="vertical" style={{ width: 300 }}>
      <Form.Item label="周期类型">
        <Select
          value={selectedType}
          onChange={handleTypeChange}
          style={{ width: '100%' }}
        >
          <Select.Option value="day">每天（格式：day-HH）</Select.Option>
          <Select.Option value="week">每周（格式：week-0到6）</Select.Option>
          <Select.Option value="month">
            每月（格式：month-01到31）
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="参数设置">
        <Input
          type="number"
          min={selectedType === 'month' ? 1 : 0}
          max={selectedType === 'day' ? 23 : selectedType === 'week' ? 6 : 31}
          value={value}
          onChange={handleValueChange}
          placeholder={
            selectedType === 'day'
              ? '小时（0-23）'
              : selectedType === 'week'
                ? '周几（0=周日）'
                : '日期（1-31）'
          }
          required
          style={{ width: '100%' }}
        />
        {error && <div style={{ color: '#f5222d', fontSize: 12 }}>{error}</div>}
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={!value || !!error}
          style={{ width: '100%' }}
        >
          生成定时表达式
        </Button>
      </Form.Item>
    </Form>
  );
};

// 解析组件
const ParseCronSchedule: React.FC<{ cronExpression: string }> = ({
  cronExpression,
}) => {
  const [parsedText, setParsedText] = useState('');

  useEffect(() => {
    const [type, value] = cronExpression.split('-');
    let parsed = '';
    switch (type) {
      case 'day':
        parsed = `天:${value}号`;
        break;
      case 'week':
        parsed = `周:${value}`;
        break;
      case 'month':
        parsed = `月:${value}号`;
        break;
      default:
        parsed = '未知类型';
    }
    setParsedText(parsed);
  }, [cronExpression]);

  return <p>{parsedText}</p>;
};

export { CronSchedule, ParseCronSchedule };
