'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function DetalhesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cd = searchParams.get('cd');
  const tipo = searchParams.get('tipo');
  const source = searchParams.get('source') || 'hoje';
  
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const fetchDetalhes = async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 0 : page;
    try {
      const apiHost = typeof window !== 'undefined' ? `http://${window.location.hostname}:3002` : 'http://localhost:3002';
      const apiRoute = source === 'vencidos' ? 'vencidos' : 'hoje';
      const url = `${apiHost}/api/pedidos/${apiRoute}/detalhe?cd=${cd}&tipo=${tipo}&page=${currentPage}&limit=20&search=${search}`;
      const res = await fetch(url);
      const data = await res.json();
      const safeData = Array.isArray(data) ? data : [];

      if (reset) setPedidos(safeData);
      else setPedidos(prev => [...prev, ...safeData]);
      
      if (safeData.length < 20) setHasMore(false);
      else setHasMore(true);

    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cd) fetchDetalhes(true);
  }, [cd, tipo, source]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchDetalhes(true);
  };

  useEffect(() => {
    if (page > 0) fetchDetalhes();
  }, [page]);

  const columns = pedidos.length > 0 ? Object.keys(pedidos[0]) : [];

  return (
    <div className="details-container">
      <header className="details-header">
        <div className="details-nav">
            <button 
                onClick={() => router.push(source === 'vencidos' ? '/pedidosabertos' : '/')}
                className="details-button"
            >
                ← VOLTAR AO DASHBOARD
            </button>
            <h1 className="details-title">Detalhes: {cd} - {tipo?.replace('_', ' ')} ({source === 'vencidos' ? 'Abertos' : 'Hoje'})</h1>
            <div style={{ width: '180px' }} className="details-spacer"></div>
        </div>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Filtrar por Pedido, NFE ou Remessa..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="details-input"
          />
          <button type="submit" className="details-button details-button-primary">
            PESQUISAR
          </button>
        </form>
      </header>
 
      <div className="details-table-wrapper">
        <table className="details-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col}>{String(p[col] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 
      {!loading && hasMore && pedidos.length >= 20 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => setPage(p => p + 1)}
            className="details-button"
            style={{ padding: '15px 40px' }}
          >
            CARREGAR MAIS (+20)
          </button>
        </div>
      )}
    </div>
  );
}

export default function DetalhesPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <DetalhesContent />
    </Suspense>
  );
}
