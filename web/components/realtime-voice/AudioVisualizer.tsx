'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { VoiceState } from '@/types/voice';

interface AudioVisualizerProps {
  isActive: boolean;
  audioLevel?: number;
  analyser?: AnalyserNode | null;
}

export default function AudioVisualizer({
  isActive,
  audioLevel = 0,
  analyser,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !analyser) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const bufferLength = analyser.frequencyBinCount;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // 渐变色：青色到紫色
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#00f5ff');
        gradient.addColorStop(1, '#7c3aed');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyser]);

  // 模拟动画（当没有真实音频数据时）
  const bars = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-1 h-16 px-8 w-full">
      {isActive && analyser ? (
        // 使用真实音频数据
        <canvas
          ref={canvasRef}
          width={800}
          height={64}
          className="w-full h-full"
        />
      ) : (
        // 模拟动画
        bars.map((i) => (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-cyan-500 to-aurora-500 rounded-full flex-shrink-0"
            animate={{
              height: isActive
                ? `${Math.random() * 40 + 10}px`
                : '4px',
              opacity: isActive ? 1 : 0.3,
            }}
            transition={{
              duration: 0.1,
              repeat: isActive ? Infinity : 0,
              repeatType: 'reverse',
              ease: 'linear',
            }}
            style={{
              transformOrigin: 'bottom',
            }}
          />
        ))
      )}
    </div>
  );
}
