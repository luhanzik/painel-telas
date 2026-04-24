'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';

const FILIAIS_ORDEM = ['FORTALEZA', 'IMPERATRIZ', 'JUAZEIRO', 'SÃO LUÍS', 'SOBRAL', 'TERESINA'];
const METRICAS_ORDEM = ['vence_hoje', 'em_rota', 'inserido', 'na_filial', 'retornos'];

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ultimaCarga, setUltimaCarga] = useState('...');
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState('...');
  
  // Estado do Scanner
  const [scanIndex, setScanIndex] = useState(0); // 0 a (6*5 - 1) = 29

  const fetchData = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const apiHost = typeof window !== 'undefined' ? `http://${window.location.hostname}:3002` : 'http://localhost:3002';
      const response = await fetch(`${apiHost}/api/pedidos/hoje/resumo`);
      const apiData = await response.json();

      const mappedData = FILIAIS_ORDEM.map(nomeFilial => {
        const itemApi = apiData.find((item: any) => item.cd.toUpperCase() === nomeFilial.toUpperCase());
        return {
          cd: nomeFilial,
          vence_hoje: itemApi ? Number(itemApi.total) : 0,
          em_rota: itemApi ? Number(itemApi.em_rota) : 0,
          inserido: itemApi ? Number(itemApi.inserido) : 0,
          na_filial: itemApi ? Number(itemApi.na_filial) : 0,
          retornos: itemApi ? Number(itemApi.retornos) : 0
        };
      });

      setData(mappedData);

      const resStatus = await fetch(`${apiHost}/api/status/ultima-atualizacao`);
      const statusData = await resStatus.json();
      setUltimaCarga(statusData.ultima);

      const agora = new Date().toLocaleTimeString('pt-BR');
      setUltimaSincronizacao(agora);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Ciclo de busca de dados (global)
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000); // Busca geral a cada 30s
    return () => clearInterval(interval);
  }, []);

  // 2. Ciclo do Scanner (muda a cada 15 segundos)
  useEffect(() => {
    const scannerInterval = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % (FILIAIS_ORDEM.length * METRICAS_ORDEM.length));
    }, 3500); // 15 segundos por célula
    return () => clearInterval(scannerInterval);
  }, []);

  return (
    <main>
      <div className="header">
        <div className="header-left">
          <div className="logos">
            <img src="/assets/LOGO-GRUPO-JB-300x206.png" alt="Logo Grupo JB" className="logo-img" />
            <img src="/assets/logo natura.png" alt="Logo Natura" className="logo-img" />
          </div>
        </div>

        <div className="header-center">
          <h1>VENCE HOJE</h1>
          <p>*QUANTIDADE DE PEDIDOS QUE A DATA DE ENTREGA ESTÁ PARA HOJE</p>
        </div>

        <div className="header-right">
          <div className="status-container">
            <div className="status-box orange">
                <span>ÚLTIMA CARGA (DB):</span>
                <strong>{ultimaCarga}</strong>
            </div>
            <div className="status-box blue">
                <span>DASHBOARD LIVE:</span>
                <strong>{ultimaSincronizacao}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {loading && data.length === 0 ? (
          <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>Iniciando Scanner...</p>
        ) : (
          data.map((item, cdIdx) => {
            // Calcula qual métrica deste CD está ativa
            const currentCdIdx = Math.floor(scanIndex / METRICAS_ORDEM.length);
            const currentMetricIdx = scanIndex % METRICAS_ORDEM.length;
            const activeMetric = cdIdx === currentCdIdx ? METRICAS_ORDEM[currentMetricIdx] : null;

            return (
              <DashboardCard 
                key={item.cd} 
                {...item} 
                activeMetric={activeMetric}
              />
            );
          })
        )}
      </div>
    </main>
  );
}
