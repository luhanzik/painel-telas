'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardCard from '@/components/DashboardCard';

const FILIAIS_ORDEM = ['FORTALEZA', 'IMPERATRIZ', 'JUAZEIRO', 'SÃO LUÍS', 'SOBRAL', 'TERESINA'];
const METRICAS_ORDEM = ['vence_hoje', 'em_rota', 'inserido', 'na_filial', 'retornos'];

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const dataRef = useRef<any[]>([]);
  const checksumRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [ultimaCarga, setUltimaCarga] = useState('...');
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState('...');
  const [apiHost, setApiHost] = useState('buscando...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estado do Scanner
  const [scanIndex, setScanIndex] = useState(0); // 0 a (6*5 - 1) = 29

  const fetchData = async (isFirstLoad = false, currentScanIndex?: number) => {
    if (isFirstLoad) setLoading(true);
    setErrorMessage(null);
    
    // Define o host da API baseado no acesso atual
    const host = typeof window !== 'undefined' ? `http://${window.location.hostname}:5010` : 'http://localhost:5010';
    setApiHost(host);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de limite

    try {
      const response = await fetch(`${host}/api/pedidos/hoje/resumo`, { 
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      
      const apiData = await response.json();

      const allMappedData = FILIAIS_ORDEM.map(nomeFilial => {
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

      // Se for carga inicial, atualiza tudo. 
      // Se for atualização do scanner, atualiza APENAS a célula ativa.
      if (isFirstLoad) {
        setData(allMappedData);
      } else if (currentScanIndex !== undefined) {
        const cdIdx = Math.floor(currentScanIndex / METRICAS_ORDEM.length);
        const metricIdx = currentScanIndex % METRICAS_ORDEM.length;
        const metricKey = METRICAS_ORDEM[metricIdx];

        const newValue = allMappedData[cdIdx][metricKey as keyof typeof allMappedData[0]];

        setData(prevData => {
          const newData = [...prevData];
          if (newData[cdIdx]) {
            newData[cdIdx] = { ...newData[cdIdx], [metricKey]: newValue };
          }
          return newData;
        });
      }

      const totalNovo = allMappedData.reduce((acc, item) => 
        acc + item.vence_hoje + item.em_rota + item.inserido + item.na_filial + item.retornos, 0);
      
      const hasChanged = totalNovo !== checksumRef.current && checksumRef.current !== 0;
      
      if (hasChanged) {
          const agora = new Date().toLocaleString('pt-BR');
          try {
            await fetch('/api/last-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: agora, checksum: totalNovo })
            });
            setUltimaCarga(agora);
            checksumRef.current = totalNovo;
          } catch (e) {
            console.error('Erro ao salvar data local:', e);
          }
      } else if (checksumRef.current === 0) {
          checksumRef.current = totalNovo;
      }

      setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR'));

    } catch (error: any) {
      console.error('❌ ERRO CRÍTICO NA API:', error.message);
      setErrorMessage(error.name === 'AbortError' ? "Tempo de conexão esgotado" : error.message);
    } finally {
      setLoading(false);
    }
  };

  // Buscar a última data e checksum gravados ao iniciar
  useEffect(() => {
    const loadLastDate = async () => {
      try {
        const res = await fetch('/api/last-update');
        const data = await res.json();
        setUltimaCarga(data.date);
        checksumRef.current = data.checksum || 0;
      } catch (e) {}
    };
    loadLastDate();
  }, []);

  // Ciclo de carga inicial e Sincronização vinculada ao Scanner
  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    const scannerInterval = setInterval(() => {
      setScanIndex((prev) => {
        const nextIndex = (prev + 1) % (FILIAIS_ORDEM.length * METRICAS_ORDEM.length);
        fetchData(false, nextIndex); // Busca e atualiza a próxima célula
        return nextIndex;
      });
    }, 3500); 
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
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Iniciando Scanner...</p>
            <p style={{ fontSize: '0.8rem' }}>Conectando em: {apiHost}</p>
            {errorMessage && (
              <p style={{ color: '#ef4444', marginTop: '20px', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '5px' }}>
                ⚠️ {errorMessage}
              </p>
            )}
          </div>
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
