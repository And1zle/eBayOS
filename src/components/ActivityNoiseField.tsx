import React, { useEffect, useRef } from 'react';

interface OrderPulse {
  x: number;
  y: number;
  born: number;
}

interface ActivityNoiseFieldProps {
  salesVolume?: number; // 0.0 to 1.0, drives wave energy
  marketShare?: number; // -1.0 (bad) to 1.0 (good), drives color
}

export function ActivityNoiseField({ 
  salesVolume = 0.7, 
  marketShare = 0.3 
}: ActivityNoiseFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let time = 0;
    let pulses: OrderPulse[] = [];

    // Simplified US Map Dot Matrix (Normalized 0-1 coords roughly)
    // This is a very rough approximation of US population centers for the "map" feel
    const usMapPoints = [
      {x: 0.1, y: 0.2}, {x: 0.1, y: 0.3}, {x: 0.1, y: 0.4}, // West Coast
      {x: 0.15, y: 0.25}, {x: 0.15, y: 0.5}, 
      {x: 0.2, y: 0.2}, {x: 0.25, y: 0.6}, // Mountain
      {x: 0.4, y: 0.3}, {x: 0.4, y: 0.5}, {x: 0.45, y: 0.7}, // Central
      {x: 0.5, y: 0.4}, {x: 0.55, y: 0.3},
      {x: 0.6, y: 0.35}, {x: 0.65, y: 0.45}, {x: 0.65, y: 0.25}, // Midwest/South
      {x: 0.75, y: 0.3}, {x: 0.75, y: 0.4}, {x: 0.75, y: 0.5}, 
      {x: 0.8, y: 0.25}, {x: 0.8, y: 0.35}, {x: 0.85, y: 0.3}, // East Coast
      {x: 0.9, y: 0.2}, {x: 0.9, y: 0.3}, {x: 0.9, y: 0.4}, {x: 0.88, y: 0.5}
    ];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // Simplex-ish noise helper (superimposed sines)
    const noise = (x: number, y: number, t: number) => {
      return (
        Math.sin(x * 0.002 + t * 0.5) * 
        Math.cos(y * 0.003 + t * 0.3) * 0.5 +
        Math.sin(x * 0.005 - t * 0.2) * 
        Math.cos(y * 0.005 + t * 0.4) * 0.25
      );
    };

    const render = () => {
      if (!ctx) return;
      
      // Clear with very slight fade for trails (optional, but clean clear is better for this style)
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Background Noise Field (Waves)
      // Color based on marketShare: -1 (Red) -> 0 (Blue) -> 1 (Green)
      // We'll interpolate between hues.
      // Base Blue: 220, Red: 0, Green: 140
      let hue = 220; // Default Blue
      if (marketShare > 0) {
        hue = 220 + (140 - 220) * marketShare; // Lerp to Green (approx 140)
      } else {
        hue = 220 + (0 - 220) * Math.abs(marketShare); // Lerp to Red (0)
      }
      
      // Amplitude based on salesVolume
      const amplitude = 50 + (salesVolume * 100);
      const speed = 0.002 + (salesVolume * 0.005);
      
      time += speed;

      // Draw fluid mesh
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.08)`;
      ctx.lineWidth = 1;

      const gridSize = 40;
      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
          const n = noise(x, y, time);
          const xOff = n * amplitude;
          const yOff = noise(x + 1000, y + 1000, time) * amplitude;
          
          // Draw small lines representing the field flow
          ctx.moveTo(x + xOff, y + yOff);
          ctx.lineTo(x + xOff + 2, y + yOff + 2);
        }
      }
      ctx.stroke();

      // 2. Draw Faint US Map Underlay
      // Scale map to center of screen
      const mapScale = Math.min(width, height) * 0.8;
      const mapOffsetX = (width - mapScale) / 2;
      const mapOffsetY = (height - mapScale * 0.6) / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      usMapPoints.forEach(p => {
        const mx = mapOffsetX + p.x * mapScale;
        const my = mapOffsetY + p.y * mapScale * 0.6; // Aspect ratio adjust
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();

        // Randomly spawn order pulse
        if (Math.random() < 0.005 * salesVolume) {
          pulses.push({ x: mx, y: my, born: performance.now() });
        }
      });

      // 3. Draw Order Pulses
      const now = performance.now();
      pulses = pulses.filter(p => now - p.born < 2000); // Live for 2s

      pulses.forEach(p => {
        const age = now - p.born;
        const life = 1 - (age / 2000); // 1.0 to 0.0
        const size = (1 - life) * 30;
        
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${life * 0.5})`;
        ctx.lineWidth = 2;
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.stroke();
      });

      requestAnimationFrame(render);
    };

    const animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [salesVolume, marketShare]);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none w-full h-full"
    />
  );
}
