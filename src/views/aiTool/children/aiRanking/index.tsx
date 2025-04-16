import styles from './aiRanking.module.scss';
import RankingTags from '../../components/RankingTags';
import Cycleselects from '../../components/CycleSelects';

const options = [
  {
    label: '总榜',
    value: 'all',
  },
  {
    label: '国内榜',
    value: 'cn',
  },
  {
    label: '国外榜',
    value: 'en',
  },
];

export default function Page() {
  return (
    <div className={styles.aiRanking}>
      <div className="aiRanking-title">AI产品 · 总榜 · 周榜</div>
      <div className="aiRanking-head">
        <div className="aiRanking-head-item">
          <div className="aiRanking-head-title">类型</div>
          <RankingTags options={options} defaultValue={options[0].value} />
        </div>
        <div className="aiRanking-head-item">
          <div className="aiRanking-head-title">周期</div>
          <div className="aiRanking-head-cycleselects">
            <Cycleselects />
          </div>
        </div>
      </div>
    </div>
  );
}
