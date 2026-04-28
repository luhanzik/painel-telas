'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface CardProps {
  cd: string;
  vence_hoje: number;
  em_rota: number;
  inserido: number;
  na_filial: number;
  retornos: number;
  activeMetric: string | null;
  mainLabel?: string; // Novo: rótulo principal (ex: Vence Hoje ou Pedidos em Aberto)
  source?: 'hoje' | 'vencidos'; // Novo: fonte para a rota de detalhes
}

// Sub-componente para animar o número subindo
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 500); // Duração da animação
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <div className={`cat-value ${isAnimating ? 'animating-up' : ''}`}>
      {displayValue}
    </div>
  );
}

export default function DashboardCard({ cd, vence_hoje, em_rota, inserido, na_filial, retornos, activeMetric, mainLabel = 'Vence Hoje', source = 'hoje' }: CardProps) {
  const router = useRouter();
  
  const handleDetailClick = (tipo: string) => {
    router.push(`/detalhes?cd=${encodeURIComponent(cd)}&tipo=${tipo}&source=${source}`);
  };

  const metrics = [
    { id: 'vence_hoje', label: mainLabel, value: vence_hoje, className: 'vence-hoje' },
    { id: 'em_rota', label: 'Em Rota', value: em_rota, className: '' },
    { id: 'inserido', label: 'Inserido', value: inserido, className: '' },
    { id: 'na_filial', label: 'Na Filial', value: na_filial, className: '' },
    { id: 'retornos', label: 'Retornos', value: retornos, className: '' },
  ];

  return (
    <div className="card">
      <div className="card-header">{cd}</div>
      <div className="card-body">
        {metrics.map((m) => (
          <div 
            key={m.id}
            className={`category ${m.className} ${activeMetric === m.id ? 'active-scanner' : ''}`} 
            onClick={() => handleDetailClick(m.id)} 
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div className="cat-label">{m.label}</div>
            <AnimatedNumber value={m.value} />
            {activeMetric === m.id && <div className="scanner-line"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
