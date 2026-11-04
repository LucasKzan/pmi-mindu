"use client";

import { useEffect, useState } from 'react';
import { getApiUrl } from './config';

/**
 * Faixa de aviso exibida quando o backend (API FastAPI) não responde.
 * Verifica a cada 15 s com um endpoint leve (/openapi.json).
 */
export default function BackendStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let ativo = true;
    const verificar = async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      try {
        const r = await fetch(getApiUrl('/openapi.json'), { signal: ctrl.signal, cache: 'no-store' });
        if (ativo) setOffline(!r.ok);
      } catch {
        if (ativo) setOffline(true);
      } finally {
        clearTimeout(timer);
      }
    };
    verificar();
    const id = setInterval(verificar, 15000);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[9999] bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 text-center shadow-md"
    >
      ⚠️ Servidor de dados temporariamente indisponível. Mapa, alertas e relatos podem não carregar. Tentando reconectar automaticamente...
    </div>
  );
}
