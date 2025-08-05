import React, { useRef, useEffect, ReactNode } from 'react';
import styles from './enhancedCard.module.scss';

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  glowEffect?: boolean;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className = '',
  style = {},
  onClick,
  glowEffect = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glowEffect || !cardRef.current || !glowRef.current) return;

    const card = cardRef.current;
    const glow = glowRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 更新光效位置
      glow.style.background = `radial-gradient(
        600px circle at ${x}px ${y}px,
        rgba(102, 126, 234, 0.15),
        transparent 40%
      )`;
    };

    const handleMouseEnter = () => {
      glow.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      glow.style.opacity = '0';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [glowEffect]);

  return (
    <div
      ref={cardRef}
      className={`${styles.enhancedCard} ${className}`}
      style={style}
      onClick={onClick}
    >
      {glowEffect && <div ref={glowRef} className={styles.glowEffect} />}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

export default EnhancedCard;