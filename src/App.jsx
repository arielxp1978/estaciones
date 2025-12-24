import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Moon, Sun, CheckCircle2, Sparkles, Loader2, Fuel, CloudLightning, 
  Calendar, Lock, ArrowRight, Trophy 
} from 'lucide-react';
import { marked } from 'marked';

// Configuración de Marked
marked.setOptions({ gfm: true, breaks: true });

// --- Mapeo de Logos Oficiales ---
const BRAND_LOGOS = {
  YPF: "https://th.bing.com/th/id/OIP.pzMMO-c752EHiEMR0Y8lBwHaHa?w=162&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=2&pid=1.7&rm=3&ucfimg=1",
  SHELL: "https://th.bing.com/th/id/OIP.FRpIJg9HCjYFXVpmvaPv6AHaEK?w=283&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=2&pid=1.7&rm=3&ucfimg=1",
  AXION: "https://th.bing.com/th/id/OIP.lgt-f-3gih_rIiQO3ZEQmwAAAA?w=132&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=2&pid=1.7&rm=3&ucfimg=1",
  PUMA: "https://th.bing.com/th/id/OIP.dPCDdtc8FJy_SxCJw29bQwHaBR?w=338&h=62&c=7&r=0&o=7&cb=ucfimg2&dpr=2&pid=1.7&rm=3&ucfimg=1",
  GULF: "https://th.bing.com/th/id/OIP.Ed9ZW4u-CqgGI8EaYAUZAQHaEK?w=266&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=2&pid=1.7&rm=3&ucfimg=1"
};

const BRAND_ORDER = ['YPF', 'SHELL', 'AXION', 'PUMA', 'GULF'];

const LogoSurtidorAI = () => (
  <div className="flex items-center gap-2 shrink-0">
    <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
      <Fuel className="text-white w-6 h-6" />
      <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 text-blue-600 font-black text-[10px] w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">$</span>
    </div>
    <div className="leading-none">
      <h1 className="font-black text-lg italic tracking-tighter dark:text-white uppercase leading-none">SURTIDOR</h1>
      <p className="text-blue-600 font-black text-xs leading-none">AI</p>
    </div>
  </div>
);

const App = () => {
  const getSafeEnv = (key, fallback) => {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        return import.meta.env[key];
      }
    } catch (e) {}
    return fallback;
  };

  const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL', "https://dodhhkrhiuphfwxdekqu.supabase.co");
  const supabaseKey = getSafeEnv('VITE_SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGhoa3JoaXVwaGZ3eGRla3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTA4NTAsImV4cCI6MjA4MjA4Njg1MH0.u3_zDNLi5vybfH1ueKgbVMg9JlpVoT7SFCcvzS_miN0");
  const appPassword = getSafeEnv('VITE_APP_PASSWORD', "");

  const [files, setFiles] = useState([]); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(appPassword === "");
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedFuels, setSelectedFuels] = useState(['Nafta Super']);
  const [selectedLocation, setSelectedLocation] = useState('Todo el país');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isPreCalculated, setIsPreCalculated] = useState(false);

  // --- Icono de Pestaña y Título ---
  useEffect(() => {
    try {
      document.title = "Surtidor AI";
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%232563eb%22/><text y=%22.9em%22 font-size=%2260%22 x=%2215%22 fill=%22white%22>⛽</text></svg>';
      document.getElementsByTagName('head')[0].appendChild(link);
    } catch (e) {}
  }, []);

  const syncFromSupabase = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/beneficios?select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const latest = new Date(Math.max(...data.map(i => new Date(i.created_at || Date.now()))));
        setLastUpdateDate(latest.toLocaleDateString('es-AR'));
        const grouped = data.reduce((acc, item) => {
          const brand = item.estacion.toUpperCase();
          if (!acc[brand]) acc[brand] = [];
          acc[brand].push(item);
          return acc;
        }, {});
        setFiles(Object.keys(grouped).map(brand => ({
          id: `brand-${brand.toLowerCase()}`,
          brand,
          items: grouped[brand]
        })).sort((a, b) => BRAND_ORDER.indexOf(a.brand) - BRAND_ORDER.indexOf(b.brand)));
      }
    } catch (err) {}
  };

  useEffect(() => { syncFromSupabase(); }, []);

  const generateLocalRanking = (currentFiles = files) => {
    const allItems = [];
    currentFiles.forEach(f => {
      f.items.forEach(item => {
        const fuelMatch = (item.combustible || '').toLowerCase().includes('todos') || 
                         selectedFuels.some(sf => (item.combustible || '').toLowerCase().includes(sf.toLowerCase()));
        if (fuelMatch) allItems.push({ ...item, brand: f.brand });
      });
    });
    const sorted = allItems.sort((a, b) => b.descuento - a.descuento).slice(0, 12);
    if (sorted.length === 0) return "### Sin Beneficios\nNo hay datos para estos filtros.";
    let md = `# 🏆 Panorama General\n\n| Estación | Banco | % | Tope |\n| :--- | :--- | :--- | :--- |\n`;
    sorted.forEach(i => md += `| **${i.brand}** | ${i.banco} | **${i.descuento}%** | $${i.tope} |\n`);
    return md;
  };

  const handleMasterAnalysis = async () => {
    if (files.length === 0) return;
    setIsAiLoading(true);
    try {
      const typeKey = selectedFuels.length === 1 ? selectedFuels[0].toLowerCase() : 'global';
      const resp = await fetch(`${supabaseUrl}/rest/v1/analisis_ia?tipo=eq.${typeKey}&localidad=eq.${selectedLocation.toLowerCase()}&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await resp.json();
      if (data && data.length > 0) {
        setAiAnalysis(data[0].contenido);
        setIsPreCalculated(true);
      } else {
        setAiAnalysis(generateLocalRanking());
        setIsPreCalculated(false);
      }
    } catch (e) {
      setAiAnalysis(generateLocalRanking());
    }
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && files.length > 0 && !activeFileId) handleMasterAnalysis();
  }, [isAuthenticated, files, activeFileId, selectedFuels, selectedLocation]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === appPassword) setIsAuthenticated(true);
    else alert("Contraseña incorrecta");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8"><Lock className="text-white w-10 h-10" /></div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-6 uppercase">Surtidor AI</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Contraseña..." className="w-full bg-slate-50 p-4 rounded-2xl text-center font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all" autoFocus />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-widest text-[11px]">Entrar <ArrowRight size={16} /></button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <LogoSurtidorAI />
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors">{isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}</button>
          </div>
          <div className="flex justify-center items-center gap-4 overflow-x-auto no-scrollbar py-1">
            <button onClick={() => setActiveFileId(null)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all shrink-0 ${!activeFileId ? 'border-blue-600 bg-blue-600 text-white font-bold' : 'border-transparent opacity-50'}`}><Sparkles size={14} /> <span className="text-[10px] uppercase font-black">Global ✨</span></button>
            {files.map(f => (
              <button key={f.id} onClick={() => setActiveFileId(f.id)} className={`flex items-center justify-center p-2 px-4 h-10 min-w-[90px] rounded-xl border-2 transition-all shrink-0 ${activeFileId === f.id ? 'border-blue-600 bg-blue-600/5' : 'border-transparent opacity-40'}`}><img src={BRAND_LOGOS[f.brand]} alt={f.brand} className="h-6 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" /></button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6 pb-32">
        <div className={`rounded-[2.5rem] border shadow-2xl overflow-hidden min-h-[60vh] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="h-full p-8 md:p-14 overflow-y-auto custom-scrollbar">
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-20"><Loader2 size={48} className="animate-spin mb-4" /><p className="font-black text-[10px] uppercase tracking-widest italic">Actualizando panorama...</p></div>
            ) : (
              <div className="markdown-body prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: marked.parse(activeFileId ? "# Beneficios " + files.find(f => f.id === activeFileId).brand : aiAnalysis || "Cargando...") }} />
            )}
          </div>
        </div>
      </main>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .markdown-body h1 { font-size: 2.2rem; font-weight: 950; color: #3b82f6; margin-bottom: 2rem; font-style: italic; text-transform: uppercase; border:none; }
        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2rem 0; border: 1px solid #e2e8f0; border-radius: 2rem; overflow: hidden; }
        .markdown-body th, .markdown-body td { padding: 20px 24px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .markdown-body th { background: rgba(59, 130, 246, 0.05); font-weight: 900; color: #3b82f6; text-transform: uppercase; font-size: 0.7rem; }
        .dark .markdown-body table { border-color: #334155; }
        .dark .markdown-body th { background: #1e293b; }
      `}</style>
    </div>
  );
};

export default App;

/** * ARRANQUE SEGURO DE PRODUCCIÓN
 * Solo se ejecuta en Netlify o dominios reales.
 * El Canvas de Google ignora este bloque por la detección de host.
 */
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const rootElement = document.getElementById('root');
  const isWebReal = window.location.hostname.includes('netlify.app') || 
                    window.location.hostname.includes('surtidor') || 
                    window.location.hostname === 'localhost';
  
  // Condición crítica: No ejecutar si estamos en el visor de Google (Canvas)
  const isGoogleCanvas = window.location.hostname.includes('goog') || window.hasOwnProperty('__POWERED_BY_CANVAS__');

  if (rootElement && isWebReal && !isGoogleCanvas) {
    if (!rootElement._reactRootContainer) {
      ReactDOM.createRoot(rootElement).render(<App />);
    }
  }
}
