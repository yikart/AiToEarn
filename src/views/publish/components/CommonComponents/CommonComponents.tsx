import { Button } from 'antd';
import styles from './commonComponents.module.scss';
import { useState } from 'react';

export const ChooseChunk = ({
  onClick,
  imgUrl,
  color,
  text,
  hoverColor,
  style,
}: {
  onClick?: () => void;
  imgUrl: string;
  hoverColor?: string;
  color: string;
  text: string;
  style?: React.CSSProperties;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div
        className={styles.chooseChunk}
        onClick={() => {
          if (onClick) onClick();
        }}
        style={
          isHovered
            ? {
                borderColor: hoverColor || color,
                ...(style || {}),
              }
            : style || {}
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img src={imgUrl} />
        <Button type="primary" size="large" style={{ background: color }}>
          {text}
        </Button>
      </div>
    </>
  );
};
