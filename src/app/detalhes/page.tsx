'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function DetalhesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cd = searchParams.get('cd');
  const tipo = searchParams.get('tipo');
  
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
      const url = `${apiHost}/api/pedidos/hoje/detalhe?cd=${cd}&tipo=${tipo}&page=${currentPage}&limit=20&search=${search}`;
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
  }, [cd, tipo]);

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
    <div style={{ padding: '20px', backgroundColor: '#1a2537', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button 
                onClick={() => router.push('/')}
                style={{ padding: '10px 20px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                ← VOLTAR AO DASHBOARD
            </button>
            <h1 style={{ textTransform: 'uppercase', margin: 0, fontSize: '1.8rem' }}>Detalhes: {cd} - {tipo?.replace('_', ' ')}</h1>
            <div style={{ width: '180px' }}></div> {/* Spacer para centralizar o título */}
        </div>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Filtrar por Pedido, NFE ou Remessa..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #334155', backgroundColor: '#242f45', color: 'white', flexGrow: 1 }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            PESQUISAR
          </button>
        </form>
      </header>

      <div style={{ overflowX: 'auto', maxHeight: '70vh', border: '1px solid #334155', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#242f45', fontSize: '0.85rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f97316', zIndex: 1 }}>
            <tr>
              {columns.map(col => (
                <th key={col} style={{ padding: '12px', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                {columns.map(col => (
                  <td key={col} style={{ padding: '10px', whiteSpace: 'nowrap' }}>{String(p[col] ?? '')}</td>
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
            style={{ padding: '12px 30px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
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
