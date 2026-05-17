'use client';

import { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  data: Uint8Array | number[] | null;
  color?: string;
  height?: number;
}

export default function WaveformCanvas({ data, color = '#10b981', height = 80 }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const barWidth = width / data.length;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;

    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / 255) * height;
      const x = i * barWidth;
      const y = height - barHeight;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }, [data, color, height]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className="w-full rounded-lg bg-gray-50"
      style={{ height: `${height}px` }}
    />
  );
}
