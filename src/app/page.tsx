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

  const fetchData = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    setErrorMessage(null);
    
    // Define o host da API baseado no acesso atual
    const host = typeof window !== 'undefined' ? `http://${window.location.hostname}:3002` : 'http://localhost:3002';
    setApiHost(host);
    
    console.log('--- Iniciando Sincronização ---');
    console.log('Target API:', host);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de limite

    try {
      const response = await fetch(`${host}/api/pedidos/hoje/resumo`, { 
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      
      const apiData = await response.json();
      console.log('Dados recebidos:', apiData.length, 'itens');

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

      const totalNovo = mappedData.reduce((acc, item) => 
        acc + item.vence_hoje + item.em_rota + item.inserido + item.na_filial + item.retornos, 0);
      
      // Compara com o checksum que veio do arquivo ou da última atualização
      // Se checksumRef.current for 0, é a primeira vez que carregamos nesta sessão
      const hasChanged = totalNovo !== checksumRef.current && checksumRef.current !== 0;
      
      console.log(`[Comparação] Antigo: ${checksumRef.current} | Novo: ${totalNovo} | Mudou: ${hasChanged}`);

      if (hasChanged) {
          const agora = new Date().toLocaleString('pt-BR');
          console.log('✅ Mudança detectada! Gravando nova data:', agora);
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
          // Inicializa o checksum da sessão com o valor atual para as próximas comparações
          checksumRef.current = totalNovo;
      }

      // Sempre atualiza os dados e o ref para a próxima comparação
      setData(mappedData);
      dataRef.current = mappedData;
      setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR'));

    } catch (error: any) {
      console.error('❌ ERRO CRÍTICO NA API:', error.message);
      setErrorMessage(error.name === 'AbortError' ? "Tempo de conexão esgotado (Porta 3002 bloqueada?)" : error.message);
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
        console.log('Base de dados carregada do JSON:', data);
      } catch (e) {}
    };
    loadLastDate();
  }, []);

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
