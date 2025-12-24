import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  Sun, 
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  X,
  Zap,
  TrendingUp,
  Database,
  RefreshCw,
  Settings,
  Wifi,
  MapPin,
  ChevronDown,
  Trophy,
  Fuel,
  CloudLightning,
  Calendar,
  Lock,
  ArrowRight,
  TrendingDown
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

// --- Componentes de UI ---
const LogoSurtidorAI = () => (
  <div className="flex items-center gap-2 shrink-0">
    <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
      <Fuel className="text-white w-6 h-6" />
      <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 text-blue-600 font-black text-[10px] w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">$</span>
    </div>
    <div className="leading-none">
      <h1 className="font-black text-lg italic tracking-tighter dark:text-white uppercase">SURTIDOR</h1>
      <p className="text-blue-600 font-black text-xs">AI</p>
    </div>
  </div>
);

const LogoArgentina = () => (
  <div className="w-5 h-5 rounded-full overflow-hidden flex flex-col border border-slate-200 shrink-0">
    <div className="bg-[#74ACDF] h-1/3 w-full" />
    <div className="bg-white h-1/3 w-full flex items-center justify-center">
      <div className="w-1 h-1 bg-yellow-400 rounded-full" />
    </div>
    <div className="bg-[#74ACDF] h-1/3 w-full" />
  </div>
);

const App = () => {
  const supabaseUrl = "https://dodhhkrhiuphfwxdekqu.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGhoa3JoaXVwaGZ3eGRla3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTA4NTAsImV4cCI6MjA4MjA4Njg1MH0.u3_zDNLi5vybfH1ueKgbVMg9JlpVoT7SFCcvzS_miN0";
  const appPassword = "";

  // --- Estados ---
  const [files, setFiles] = useState([]); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!appPassword);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Filtros
  const [selectedFuels, setSelectedFuels] = useState(['Nafta Super']);
  const [selectedLocation, setSelectedLocation] = useState('Todo el país');
  const [isFuelMenuOpen, setIsFuelMenuOpen] = useState(false);
  const [isLocMenuOpen, setIsLocMenuOpen] = useState(false);

  // IA y Análisis
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [brandAnalysis, setBrandAnalysis] = useState(null);
  const [isPreCalculated, setIsPreCalculated] = useState(false);

  const fuelOptions = ['Nafta Super', 'Nafta Premium', 'Gasoil', 'Gasoil Premium', 'GNC'];
  const locations = ['Todo el país', 'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Santa Fe', 'Tucumán'];
  const apiKey = ""; 

  // --- Sincronización ---
  const syncFromSupabase = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/beneficios?select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        const dates = data.map(i => new Date(i.created_at || Date.now()));
        const latest = new Date(Math.max(...dates));
        setLastUpdateDate(latest.toLocaleDateString('es-AR'));
        
        const grouped = data.reduce((acc, item) => {
          const brand = item.estacion.toUpperCase();
          if (!acc[brand]) acc[brand] = [];
          acc[brand].push(item);
          return acc;
        }, {});

        const formattedFiles = Object.keys(grouped).map(brand => ({
          id: `brand-${brand.toLowerCase()}`,
          brand,
          items: grouped[brand]
        })).sort((a, b) => {
          let idxA = BRAND_ORDER.indexOf(a.brand);
          let idxB = BRAND_ORDER.indexOf(b.brand);
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });

        setFiles(formattedFiles);
      }
    } catch (err) {
      console.error("Error cargando base de datos:", err);
    }
  };

  useEffect(() => {
    syncFromSupabase();
  }, []);

  // --- Lógica de Ranking Automático (Información de Entrada) ---
  const generateLocalRanking = () => {
    const allItems = [];
    files.forEach(f => {
      f.items.forEach(item => {
        const fuelMatch = (item.combustible || '').toLowerCase().includes('todos') || 
                         selectedFuels.some(sf => (item.combustible || '').toLowerCase().includes(sf.toLowerCase()));
        if (fuelMatch) {
          allItems.push({ ...item, brand: f.brand });
        }
      });
    });

    // Ordenar por descuento descendente
    const sorted = allItems.sort((a, b) => b.descuento - a.descuento).slice(0, 10);

    if (sorted.length === 0) return "### Sin Beneficios\nNo se encontraron beneficios cargados para los filtros seleccionados.";

    let md = `# 🏆 Mejores Descuentos de Hoy\n`;
    md += `Análisis global de oportunidades para **${selectedFuels.join(' + ')}** en **${selectedLocation}**.\n\n`;
    md += `| Estación | Banco / Billetera | % Desc. | Tope |\n| :--- | :--- | :--- | :--- |\n`;
    sorted.forEach(i => {
      md += `| **${i.brand}** | ${i.banco} | **${i.descuento}%** | $${i.tope} |\n`;
    });
    md += `\n> ✨ **Tip de Ahorro:** Pulsa sobre el logo de una estación arriba para ver su estrategia específica.\n\n`;
    md += `--- \n\n ### 📊 Resumen por Estación\n`;
    
    BRAND_ORDER.forEach(b => {
        const brandFile = files.find(f => f.brand === b);
        if (brandFile) {
            const best = brandFile.items
                .filter(item => (item.combustible || '').toLowerCase().includes('todos') || selectedFuels.some(sf => (item.combustible || '').toLowerCase().includes(sf.toLowerCase())))
                .sort((x, y) => y.descuento - x.descuento)[0];
            if (best) {
                md += `* **${b}**: Hasta **${best.descuento}%** con ${best.banco}.\n`;
            }
        }
    });

    return md;
  };

  const callGemini = async (prompt, systemInstruction = "") => {
    if (!apiKey) return null;
    setIsAiLoading(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });
      const data = await response.json();
      setIsAiLoading(false);
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      setIsAiLoading(false);
      return null;
    }
  };

  const handleMasterAnalysis = async () => {
    setIsAiLoading(true);
    setIsPreCalculated(false);
    
    // 1. Intentar buscar en caché Cloud
    try {
      const typeKey = selectedFuels.length === 1 ? selectedFuels[0].toLowerCase() : 'global';
      const locKey = selectedLocation.toLowerCase();
      const resp = await fetch(`${supabaseUrl}/rest/v1/analisis_ia?tipo=eq.${typeKey}&localidad=eq.${locKey}&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await resp.json();
      if (data && data.length > 0) {
        setAiAnalysis(data[0].contenido);
        setIsPreCalculated(true);
        setIsAiLoading(false);
        return;
      }
    } catch (e) {}

    // 2. Si no hay caché, intentar Gemini si hay API Key, si no usar Ranking Local
    if (files.length > 0) {
      const context = files.map(f => `ESTACIÓN: ${f.brand}\n${generateMarkdownContent(f.brand, f.items)}`).join('\n---\n');
      const res = await callGemini(context, `Genera un ranking de ahorro para ${selectedFuels.join(', ')} en ${selectedLocation}.`);
      setAiAnalysis(res || generateLocalRanking());
    }
    setIsAiLoading(false);
  };

  const handleBrandAnalysis = async () => {
    const file = files.find(f => f.id === activeFileId);
    if (!file) return;
    setIsAiLoading(true);
    const context = generateMarkdownContent(file.brand, file.items);
    const res = await callGemini(context, `Analiza los beneficios de ${file.brand}. Resume 3 estrategias clave.`);
    setBrandAnalysis(res);
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (files.length > 0 && isAuthenticated) {
      if (!activeFileId) handleMasterAnalysis();
      else handleBrandAnalysis();
    }
  }, [activeFileId, selectedFuels, selectedLocation, files, isAuthenticated]);

  const filterItems = (items, fuels) => {
    return items.filter(item => {
      const f = (item.combustible || '').toLowerCase();
      return f.includes('todos') || fuels.some(sel => f.includes(sel.toLowerCase()));
    });
  };

  const generateMarkdownContent = (brand, items) => {
    let md = `# Beneficios ${brand}\n\n`;
    selectedFuels.forEach(fuel => {
      const filtered = filterItems(items, [fuel]);
      md += `## Combustible: ${fuel}\n\n`;
      if (filtered.length === 0) {
        md += `> **Sin promociones ni descuentos** para **${fuel}** actualmente.\n\n`;
      } else {
        md += `| Banco / Billetera | Medio Pago | Día | % Desc. | Tope |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        filtered.forEach(i => {
          md += `| **${i.banco}** | ${i.medio_pago} | ${i.dia} | ${i.descuento}% | $${i.tope} |\n`;
        });
        md += `\n`;
      }
    });
    return md;
  };

  const toggleFuelSelection = (fuel) => {
    if (selectedFuels.includes(fuel)) {
      if (selectedFuels.length > 1) setSelectedFuels(selectedFuels.filter(f => f !== fuel));
    } else {
      setSelectedFuels(selectedFuels.length < 2 ? [...selectedFuels, fuel] : [selectedFuels[1], fuel]);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === appPassword) setIsAuthenticated(true);
    else alert("Contraseña incorrecta");
  };

  if (!isAuthenticated && appPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8">
            <Lock className="text-white w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Surtidor AI</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="Contraseña..." 
              className="w-full bg-slate-50 p-4 rounded-2xl text-center text-sm font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all" 
              autoFocus 
            />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-widest text-[11px]">
              Entrar <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER 3 LÍNEAS */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col gap-4">
          
          {/* LÍNEA 1 */}
          <div className="flex items-center justify-between">
            <LogoSurtidorAI />
            <div className="flex items-center gap-4">
              {lastUpdateDate && (
                <div className="hidden sm:flex items-center gap-2 bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/10">
                  <Calendar size={14} className="text-blue-600" />
                  <span className="text-[10px] font-black text-blue-600 uppercase italic leading-none">SINCRO: {lastUpdateDate}</span>
                </div>
              )}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors">
                {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}
              </button>
            </div>
          </div>

          {/* LÍNEA 2 */}
          <div className="flex justify-center items-center gap-4 overflow-x-auto no-scrollbar py-1 border-y border-slate-500/5">
            <button 
              onClick={() => setActiveFileId(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all shrink-0 ${!activeFileId ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              <Sparkles size={14} /> <span className="text-[10px] uppercase font-black tracking-widest">Global ✨</span>
            </button>
            {files.map(f => (
              <button 
                key={f.id} 
                onClick={() => setActiveFileId(f.id)}
                className={`flex items-center justify-center p-2 px-4 h-10 min-w-[90px] rounded-xl border-2 transition-all shrink-0 ${activeFileId === f.id ? 'border-blue-600 bg-blue-600/5' : 'border-transparent opacity-40 hover:opacity-100 hover:bg-slate-500/5'}`}
              >
                <img src={BRAND_LOGOS[f.brand]} alt={f.brand} className="h-6 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
              </button>
            ))}
          </div>

          {/* LÍNEA 3 */}
          <div className="flex justify-center items-center gap-4">
            <div className="relative">
              <button onClick={() => setIsFuelMenuOpen(!isFuelMenuOpen)} className="flex items-center gap-2 px-4 py-2 bg-slate-500/5 border border-slate-500/10 rounded-xl hover:bg-slate-500/10 transition-all">
                <Fuel size={16} className="text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-tight">{selectedFuels.length > 1 ? `Comb. (${selectedFuels.length})` : selectedFuels[0]}</span>
                <ChevronDown size={14} className={`transition-transform ${isFuelMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isFuelMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50">
                  {fuelOptions.map(f => (
                    <button key={f} onClick={() => toggleFuelSelection(f)} className={`w-full text-left p-2.5 rounded-lg text-[10px] font-bold flex items-center justify-between mb-1 ${selectedFuels.includes(f) ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      {f} {selectedFuels.includes(f) && <CheckCircle2 size={12}/>}
                    </button>
                  ))}
                  <button onClick={() => setIsFuelMenuOpen(false)} className="w-full mt-2 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase text-center">Cerrar</button>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button onClick={() => setIsLocMenuOpen(!isLocMenuOpen)} className="flex items-center gap-2 px-4 py-2 bg-slate-500/5 border border-slate-500/10 rounded-xl hover:bg-slate-500/10 transition-all">
                <LogoArgentina />
                <span className="text-[11px] font-black uppercase tracking-tight">{selectedLocation}</span>
                <ChevronDown size={14} className={`transition-transform ${isLocMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLocMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50">
                   {locations.map(l => (
                     <button key={l} onClick={() => {setSelectedLocation(l); setIsLocMenuOpen(false);}} className={`w-full text-left p-2.5 rounded-lg text-[10px] font-bold mb-1 ${selectedLocation === l ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                       {l}
                     </button>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-[1200px] mx-auto p-6 flex flex-col gap-6 pb-32">
        
        {/* Botón Refrescar Análisis */}
        <div className="flex justify-center">
          <button 
            onClick={() => activeFileId ? handleBrandAnalysis() : handleMasterAnalysis()}
            disabled={isAiLoading}
            className="flex items-center gap-3 px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.1em] text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Refrescar Análisis ✨
          </button>
        </div>

        <div className={`rounded-[2.5rem] border shadow-2xl overflow-hidden min-h-[60vh] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="h-full p-8 md:p-14 overflow-y-auto custom-scrollbar">
            {!activeFileId ? (
              <div className="animate-in fade-in duration-500">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 opacity-20"><Loader2 size={48} className="animate-spin mb-4" /><p className="font-black text-[10px] uppercase tracking-widest italic">Calculando oportunidades de ahorro...</p></div>
                ) : aiAnalysis ? (
                  <div className="markdown-body">
                    <div className={`flex items-center gap-4 mb-10 p-6 rounded-3xl border shadow-inner ${isPreCalculated ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-blue-600/5 border-blue-600/10'}`}>
                      {isPreCalculated ? <CloudLightning className="text-emerald-500" size={32} /> : <Trophy className="text-blue-600" size={32} />}
                      <div>
                        <p className={`m-0 text-sm font-black uppercase italic ${isPreCalculated ? 'text-emerald-600' : 'text-blue-600'}`}>{isPreCalculated ? 'Análisis Cloud Optimizado 🚀' : 'Ranking Global en Tiempo Real ✨'}</p>
                        <p className="m-0 text-[10px] opacity-60 font-medium tracking-tight">Información de entrada generada automáticamente.</p>
                      </div>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(aiAnalysis) }} />
                  </div>
                ) : <div className="text-center py-20 opacity-10 uppercase font-black tracking-widest italic">Cargando beneficios...</div>}
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-10 duration-500">
                <div className="flex flex-col gap-6 mb-10">
                   <div className="flex items-center gap-4">
                      <div className="p-4 bg-blue-600/10 rounded-2xl shadow-inner">
                         <img src={BRAND_LOGOS[files.find(f => f.id === activeFileId)?.brand]} className="h-10 w-auto object-contain" />
                      </div>
                      <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none dark:text-white">Beneficios {files.find(f => f.id === activeFileId)?.brand}</h2>
                   </div>
                   {brandAnalysis && (
                     <div className="bg-blue-500/5 p-6 rounded-[2rem] border border-blue-500/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-blue-600 font-black uppercase text-[10px] tracking-widest"><Sparkles size={16}/> Estrategia IA</div>
                        <div className="text-sm opacity-80 leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(brandAnalysis) }} />
                     </div>
                   )}
                </div>
                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(generateMarkdownContent(files.find(f => f.id === activeFileId).brand, files.find(f => f.id === activeFileId).items)) }} />
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        
        .markdown-body h1 { font-size: 2.5rem; font-weight: 950; color: #3b82f6; margin-bottom: 2rem; font-style: italic; text-transform: uppercase; line-height: 0.9; border:none; letter-spacing: -0.05em; }
        .markdown-body h2 { font-size: 1.6rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1.2rem; color: #3b82f6; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem; }
        .markdown-body h3 { font-size: 1.2rem; font-weight: 900; margin-top: 1.5rem; margin-bottom: 1rem; color: #3b82f6; text-transform: uppercase; }
        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2rem 0; border: 1px solid #e2e8f0; border-radius: 2rem; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }
        .markdown-body th, .markdown-body td { padding: 20px 24px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .markdown-body th { background: rgba(59, 130, 246, 0.05); font-weight: 900; text-transform: uppercase; font-size: 0.7rem; color: #3b82f6; letter-spacing: 0.1em; }
        .markdown-body strong { color: #3b82f6; font-weight: 900; }
        .markdown-body blockquote { border-left: 8px solid #3b82f6; background: #eff6ff; padding: 1.5rem 2rem; margin: 2rem 0; border-radius: 0 2rem 2rem 0; font-style: italic; }
        
        .dark .markdown-body h1, .dark .markdown-body h2, .dark .markdown-body h3 { color: #60a5fa; }
        .dark .markdown-body table { border-color: #334155; }
        .dark .markdown-body th { background: #1e293b; color: #3b82f6; }
        .dark .markdown-body td { border-bottom-color: #334155; color: #cbd5e1; }
        .dark .markdown-body blockquote { background: #1e293b; border-left-color: #3b82f6; color: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
