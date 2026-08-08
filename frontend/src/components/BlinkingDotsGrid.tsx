import { useEffect, useRef } from 'react';
import { getTheme } from '../lib/theme';

export default function BlinkingDotsGrid({ opacity = 1 }: { opacity?: number } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef<'dark' | 'light'>(getTheme());

  useEffect(() => {
    const themeObserver = new MutationObserver(() => {
      themeRef.current = getTheme();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => themeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let dots: { x: number, y: number, baseAlpha: number, currentAlpha: number, targetAlpha: number, speed: number }[] = [];
    
    const spacing = 32;
    const radius = 1.5;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots();
    };

    const initDots = () => {
      dots = [];
      const cols = Math.floor(canvas.width / spacing) + 1;
      const rows = Math.floor(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing + (spacing / 2);
          const y = j * spacing + (spacing / 2);
          // 15% of dots are allowed to blink
          const isBlinking = Math.random() < 0.15; 
          
          dots.push({
            x,
            y,
            baseAlpha: 0.15,
            currentAlpha: 0.15,
            targetAlpha: 0.15,
            speed: isBlinking ? (Math.random() * 0.015 + 0.005) : 0,
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        if (dot.speed > 0) {
          if (Math.abs(dot.currentAlpha - dot.targetAlpha) < 0.01) {
             // Assign a new random target alpha between 0.05 and 0.6
             dot.targetAlpha = Math.random() * 0.55 + 0.05;
          }
          
          if (dot.currentAlpha < dot.targetAlpha) {
            dot.currentAlpha += dot.speed;
          } else if (dot.currentAlpha > dot.targetAlpha) {
            dot.currentAlpha -= dot.speed;
          }
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = themeRef.current === 'light'
          ? `rgba(24, 24, 27, ${dot.currentAlpha * opacity})`
          : `rgba(255, 255, 255, ${dot.currentAlpha * opacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
