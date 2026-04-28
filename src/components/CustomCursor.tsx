'use client';

import { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prevPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Calcula a direção do movimento para rotacionar levemente o caminhão
      const deltaX = clientX - prevPos.current.x;
      const tilt = Math.min(Math.max(deltaX * 0.5, -15), 15); // Limita a inclinação
      
      setPosition({ x: clientX, y: clientY });
      setRotation(tilt);
      prevPos.current = { x: clientX, y: clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '600px',
        height: '400px',
        pointerEvents: 'none',
        zIndex: 9999,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transition: 'transform 0.1s ease-out',
        backgroundImage: 'url("/assets/caminhao_cursor.ico")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        filter: 'drop-shadow(0 8px 15px rgba(0,0,0,0.6))',
      }}
    >
        {/* Animação de "fumaça" opcional ao correr? */}
        <div style={{
            position: 'absolute',
            bottom: '5px',
            left: '-10px',
            width: '10px',
            height: '10px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            opacity: Math.abs(rotation) > 5 ? 0.5 : 0,
            transition: 'opacity 0.2s'
        }} />
    </div>
  );
}
