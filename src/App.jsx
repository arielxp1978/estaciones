import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Moon, Sun, CheckCircle2, Sparkles, Loader2, Fuel, CloudLightning, 
  Calendar, Lock, ArrowRight, Trophy, MessageSquare, X, Send 
} from 'lucide-react';
import { marked } from 'marked';

// Configuración de Marked para procesar tablas y saltos de línea
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
      <p className="text-blue-600 font-black text-[10px] leading-none uppercase tracking-widest">AI</p>
    </div>
  </div>
);

const App = () => {
  // --- Función de acceso seguro a variables para evitar errores de import.meta en el compilador ---
  const getEnvVar = (key, fallback = "") => {
    try {
      // Intento de acceso dinámico para que el compilador no detecte import.meta estáticamente
      const meta = (new Function("return import.meta.env"))();
      return meta[key] || fallback;
    } catch (e) {
      // Fallback manual si el objeto no existe (común en previsualización local)
      const processEnv = typeof process !== 'undefined' ? process.env : {};
      return processEnv[key] || fallback;
    }
  };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', "https://dodhhkrhiuphfwxdekqu.supabase.co");
  const supabaseKey = getEnvVar('VITE_SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGhoa3JoaXVwaGZ3eGRla3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTA4NTAsImV4cCI6MjA4MjA4Njg1MH0.u3_zDNLi5vybfH1ueKgbVMg9JlpVoT7SFCcvzS_miN0");
  const appPassword = getEnvVar('VITE_APP_PASSWORD', "");
  const geminiApiKey = getEnvVar('VITE_GEMINI_API_KEY', "");

  // --- Estados ---
  const [files, setFiles] = useState([]); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(appPassword === "");
  const [passwordInput, setPasswordInput] = useState('');
  
  // Asistente Inteligente
  const [userPrompt, setUserPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiConsulting, setIsAiConsulting] = useState(false);

  // Filtros y Análisis
  const [selectedFuels, setSelectedFuels] = useState(['Nafta Super']);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    try {
      document.title = "Surtidor AI - Comparador";
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
          const brand = (item.estacion || 'Otros').toUpperCase();
          if (!acc[brand]) acc[brand] = [];
          acc[brand].push(item);
          return acc;
        }, {});
        setFiles(Object.keys(grouped).map(brand => ({
          id: `brand-${brand.toLowerCase()}`,
          brand,
          items: grouped[brand]
        })).sort((a, b) => {
            const idxA = BRAND_ORDER.indexOf(a.brand);
            const idxB = BRAND_ORDER.indexOf(b.brand);
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        }));
      }
    } catch (err) {}
  };

  useEffect(() => { syncFromSupabase(); }, []);

  // --- Ordenamiento: Mayor % primero, luego mayor Tope ---
  const sortBeneficios = (items) => {
    return [...items].sort((a, b) => (b.descuento - a.descuento) || (b.tope - a.tope));
  };

  const generateMarkdownTable = (brand, items) => {
    if (!items) return "# Sin Datos";
    let md = `# Beneficios ${brand}\n\n`;
    selectedFuels.forEach(fuel => {
      let filtered = items.filter(item => 
        (item.combustible || '').toLowerCase().includes('todos') || 
        (item.combustible || '').toLowerCase().includes(fuel.toLowerCase())
      );
      
      const sorted = sortBeneficios(filtered);

      md += `## Combustible: ${fuel}\n\n`;
      if (sorted.length === 0) {
        md += `> Sin promociones vigentes para **${fuel}** actualmente.\n\n`;
      } else {
        md += `| Banco / Billetera | Medio Pago | Día | % Desc. | Tope |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        sorted.forEach(i => {
          md += `| **${i.banco}** | ${i.medio_pago} | ${i.dia} | **${i.descuento}%** | $${i.tope} |\n`;
        });
        md += `\n`;
      }
    });
    return md;
  };

  const generateLocalRanking = (currentFiles = files) => {
    const allItems = [];
    currentFiles.forEach(f => {
      f.items.forEach(item => {
        const fuelMatch = (item.combustible || '').toLowerCase().includes('todos') || 
                         selectedFuels.some(sf => (item.combustible || '').toLowerCase().includes(sf.toLowerCase()));
        if (fuelMatch) allItems.push({ ...item, brand: f.brand });
      });
    });
    const sorted = sortBeneficios(allItems).slice(0, 12);
    if (sorted.length === 0) return "### Sin Beneficios\nNo hay datos cargados.";
    
    let md = `# 🏆 Panorama General de Ahorro\n\n`;
    md += `A continuación las mejores opciones para maximizar tu carga hoy.\n\n`;
    md += `| Estación | Banco | % Desc. | Tope |\n| :--- | :--- | :--- | :--- |\n`;
    sorted.forEach(i => md += `| **${i.brand}** | ${i.banco} | **${i.descuento}%** | $${i.tope} |\n`);
    md += `\n--- \n\n ### 💡 Resumen por Estación\n`;
    BRAND_ORDER.forEach(b => {
        const data = currentFiles.find(f => f.brand === b);
        if (data) {
            const top = sortBeneficios(data.items)[0];
            if (top) md += `* En **${b}**, el mejor descuento es del **${top.descuento}%** con ${top.banco}.\n`;
        }
    });
    return md;
  };

  // --- Consulta al Asistente Gemini ---
  const handleAiConsult = async () => {
    if (!userPrompt.trim()) return;
    if (!geminiApiKey) {
        setAiResponse("⚠️ **Configuración Pendiente:** Por favor, ve a Netlify y añade la variable `VITE_GEMINI_API_KEY` con tu clave de Google AI Studio.");
        return;
    }
    setIsAiConsulting(true);
    setAiResponse(null);

    const context = files.map(f => `MARCA ${f.brand}:\n${f.items.map(i => `- ${i.banco} (${i.medio_pago}): ${i.descuento}% desc, tope $${i.tope}`).join('\n')}`).join('\n\n');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Eres un experto en ahorro de combustibles en Argentina. Dados estos datos:\n\n${context}\n\nEl usuario dice: "${userPrompt}". Crea un plan de carga semanal optimizado para él basándote exclusivamente en los beneficios listados. Indica día, banco, estación y cuánto puede ahorrar aproximadamente. Responde en Markdown.` }] }]
        })
      });
      const data = await response.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "La IA no pudo procesar tu pedido.");
    } catch (e) {
      setAiResponse("Error al conectar con el asistente.");
    }
    setIsAiConsulting(false);
  };

  const handleMasterAnalysis = async () => {
    if (files.length === 0) return;
    setIsAiLoading(true);
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/analisis_ia?tipo=eq.global&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await resp.json();
      setAiAnalysis(data && data.length > 0 ? data[0].contenido : generateLocalRanking());
    } catch (e) {
      setAiAnalysis(generateLocalRanking());
    }
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && files.length > 0 && !activeFileId) handleMasterAnalysis();
  }, [isAuthenticated, files, activeFileId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === appPassword) setIsAuthenticated(true);
    else alert("Contraseña incorrecta");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 animate-pulse"><Lock className="text-white w-10 h-10" /></div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-6 uppercase">Surtidor AI</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Contraseña..." className="w-full bg-slate-50 p-4 rounded-2xl text-center font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all" autoFocus />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-widest text-[11px]">Entrar <ArrowRight size={16} /></button>
          </form>
        </div>
      </div>
    );
  }

  const activeBrandData = activeFileId ? files.find(f => f.id === activeFileId) : null;

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <LogoSurtidorAI />
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors">{isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}</button>
          </div>
          <div className="flex justify-center items-center gap-4 overflow-x-auto no-scrollbar py-1">
            <button onClick={() => setActiveFileId(null)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all shrink-0 ${!activeFileId ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20' : 'border-transparent opacity-50 hover:opacity-100'}`}><Sparkles size={14} /> <span className="text-[10px] uppercase font-black tracking-widest">Global ✨</span></button>
            {files.map(f => (
              <button key={f.id} onClick={() => setActiveFileId(f.id)} className={`flex items-center justify-center p-2 px-4 h-10 min-w-[90px] rounded-xl border-2 transition-all shrink-0 ${activeFileId === f.id ? 'border-blue-600 bg-blue-600/5' : 'border-transparent opacity-40 hover:opacity-100'}`}><img src={BRAND_LOGOS[f.brand]} alt={f.brand} className="h-6 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" /></button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-32 flex flex-col gap-8">
        
        {/* ASISTENTE INTELIGENTE (CUADRO AZUL) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md"><MessageSquare size={20} /></div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Asistente Inteligente</h3>
                </div>
                <p className="text-blue-100 text-sm mb-6 leading-relaxed opacity-90">Escriba aquí qué bancos, tarjetas y billeteras tiene para indicarle sus mejores opciones.</p>
                <div className="flex flex-col gap-3">
                    <textarea 
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Ej: Tengo Banco Nación, Galicia y uso Modo..."
                        className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-medium placeholder:text-white/30 outline-none focus:bg-white/20 transition-all resize-none h-24 text-white"
                    />
                    <button onClick={handleAiConsult} disabled={isAiConsulting || !userPrompt.trim()} className="w-full bg-white text-blue-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50">
                        {isAiConsulting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Armar mi plan personalizado
                    </button>
                </div>
                {aiResponse && (
                    <div className="mt-8 bg-white/95 text-slate-900 p-6 rounded-3xl animate-in slide-in-from-top-4 duration-500 shadow-xl prose prose-sm max-w-none">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest italic">Plan Sugerido ✨</span>
                            <button onClick={() => setAiResponse(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: marked.parse(aiResponse) }} />
                    </div>
                )}
            </div>
            <Sparkles className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 rotate-12" />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className={`rounded-[2.5rem] border shadow-2xl overflow-hidden min-h-[60vh] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="h-full p-8 md:p-14 overflow-y-auto custom-scrollbar">
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-20"><Loader2 size={48} className="animate-spin mb-4" /><p className="font-black text-[10px] uppercase tracking-widest italic">Actualizando información...</p></div>
            ) : (
              <div className="markdown-body prose max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: marked.parse(activeBrandData ? generateMarkdownTable(activeBrandData.brand, activeBrandData.items) : aiAnalysis || "Cargando...") }} />
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        .markdown-body h1 { font-size: 2.2rem; font-weight: 950; color: #3b82f6; margin-bottom: 2rem; font-style: italic; text-transform: uppercase; line-height: 1; border:none; letter-spacing: -0.05em; }
        .markdown-body h2 { font-size: 1.4rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 1rem; color: #3b82f6; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem; }
        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 1.5rem 0; border: 1px solid #e2e8f0; border-radius: 2rem; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); font-size: 0.85rem; }
        .markdown-body th, .markdown-body td { padding: 18px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .markdown-body th { background: rgba(59, 130, 246, 0.05); font-weight: 900; text-transform: uppercase; font-size: 0.65rem; color: #3b82f6; letter-spacing: 0.05em; }
        .markdown-body strong { color: #3b82f6; font-weight: 900; }
        .markdown-body blockquote { border-left: 6px solid #3b82f6; background: #eff6ff; padding: 1.2rem; margin: 1.5rem 0; border-radius: 0 2rem 2rem 0; font-style: italic; }
        .dark .markdown-body h1, .dark .markdown-body h2 { color: #60a5fa; }
        .dark .markdown-body table { border-color: #334155; }
        .dark .markdown-body th { background: #1e293b; color: #3b82f6; }
        .dark .markdown-body td { border-bottom-color: #334155; color: #cbd5e1; }
        .dark .markdown-body blockquote { background: #1e293b; border-left-color: #3b82f6; color: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;

/** * ARRANQUE SEGURO DE PRODUCCIÓN (NETLIFY) */
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const isGoogleCanvas = window.location.hostname.includes('goog') || window.hasOwnProperty('__POWERED_BY_CANVAS__');
    if (!isGoogleCanvas) {
      if (!rootElement.hasChildNodes()) {
        ReactDOM.createRoot(rootElement).render(<App />);
      }
    }
  }
}
