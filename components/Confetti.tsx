import React, { useEffect, useState } from 'react';

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<{id: number, x: number, y: number, color: string}[]>([]);

  useEffect(() => {
    const colors = ['#f97316', '#fb923c', '#fdba74', '#ef4444', '#84cc16'];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p, i) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full animate-[bounce_3s_infinite]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            animationDuration: `${1 + Math.random() * 2}s`,
            animationDelay: `${Math.random()}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  );
};
