import React, { useEffect, useState, useRef } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1.4,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();

  // Extract clean number
  const numericValue = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

  const [displayValue, setDisplayValue] = useState<number>(shouldReduceMotion ? numericValue : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(numericValue);
      return;
    }

    if (!isInView) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const startValue = 0;
    const durationMs = duration * 1000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);

      // Smooth ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (numericValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [numericValue, isInView, duration, shouldReduceMotion]);

  const formatted = decimals > 0
    ? displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default AnimatedNumber;
