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
  ArrowRight
} from 'lucide-react';
import { marked } from 'marked';

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

// --- Componentes Visuales ---
const LogoSurtidorAI = () => (
  <div className="flex items-center gap-2 shrink-0">
    <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
      <Fuel className="text-white w-6 h-6" />
      <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 text-blue-600 font-black text-[10px] w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">$</span>
    </div>
    <div className="leading-none">
      <h1 className="font-black text-lg italic tracking-tighter dark:text-white">SURTIDOR</h1>
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
  // --- Acceso Seguro a Variables de Env (Compatibilidad Sandbox + Netlify) ---
  const getSafeEnv = (key, fallback) => {
    try {
      // Intento de acceso a import.meta.env para Vite/Netlify
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || fallback;
      }
    } catch (e) {}
    return fallback;
  };

  const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL', "https://dodhhkrhiuphfwxdekqu.supabase.co");
  const supabaseKey = getSafeEnv('VITE_SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGhoa3JoaXVwaGZ3eGRla3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTA4NTAsImV4cCI6MjA4MjA4Njg1MH0.u3_zDNLi5vybfH1ueKgbVMg9JlpVoT7SFCcvzS_miN0");
  const appPassword = getSafeEnv('VITE_APP_PASSWORD', ""); 

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [files, setFiles] = useState([]); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);

  // Filtros
  const [selectedFuels, setSelectedFuels] = useState(['Nafta Super']);
  const [selectedLocation, setSelectedLocation] = useState('Todo el país');
  const [isFuelMenuOpen, setIsFuelMenuOpen] = useState(false);
  const [isLocMenuOpen, setIsLocMenuOpen] = useState(false);
  
  const fuelOptions = ['Nafta Super', 'Nafta Premium', 'Gasoil', 'Gasoil Premium', 'GNC'];
  const locations = ['Todo el país', 'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Santa Fe', 'Tucumán'];

  // Supabase UI
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState('idle');

  // AI
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [brandAnalysis, setBrandAnalysis] = useState(null);
  const [isPreCalculated, setIsPreCalculated] = useState(false);

  const apiKey = ""; // Inyectar tu API Key aquí

  useEffect(() => {
    if (supabaseUrl && supabaseKey) syncFromSupabase();
  }, []);

  useEffect(() => {
    if (isAuthenticated && files.length > 0) {
      if (!activeFileId) handleMasterAnalysis();
      else handleBrandAnalysis();
    }
  }, [files, activeFileId, selectedFuels, selectedLocation, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === appPassword || !appPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const toggleFuel = (fuel) => {
    if (selectedFuels.includes(fuel)) {
      if (selectedFuels.length > 1) setSelectedFuels(selectedFuels.filter(f => f !== fuel));
    } else {
      if (selectedFuels.length < 2) {
        setSelectedFuels([...selectedFuels, fuel]);
      } else {
        setSelectedFuels([selectedFuels[1], fuel]);
      }
    }
  };

  const syncFromSupabase = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/beneficios?select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      
      if (data.length > 0) {
        const dates = data.map(i => new Date(i.created_at || Date.now()));
        const latest = new Date(Math.max(...dates));
        setLastUpdateDate(latest.toLocaleDateString('es-AR'));
      }

      const grouped = data.reduce((acc, item) => {
        const stationName = item.estacion.toUpperCase();
        if (!acc[stationName]) acc[stationName] = [];
        acc[stationName].push(item);
        return acc;
      }, {});

      const cloudFiles = Object.keys(grouped).map(brand => ({
        id: `db-${brand.toLowerCase()}`,
        brand: brand,
        items: grouped[brand]
      }));

      setFiles(cloudFiles.sort((a, b) => {
        let indexA = BRAND_ORDER.indexOf(a.brand);
        let indexB = BRAND_ORDER.indexOf(b.brand);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      }));
      setDbStatus('success');
    } catch (err) {
      setDbStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const filterItemsByFuel = (items, fuels) => {
    return items.filter(item => {
      const itemFuel = (item.combustible || '').toLowerCase();
      if (itemFuel.includes('todos')) return true;
      return fuels.some(f => itemFuel.includes(f.toLowerCase()) || f.toLowerCase().includes(itemFuel));
    });
  };

  const generateMarkdownForActive = (brand, items) => {
    let md = `# Beneficios ${brand}\n\n`;
    selectedFuels.forEach(fuel => {
      const filtered = filterItemsByFuel(items, [fuel]);
      md += `## Combustible: ${fuel}\n\n`;
      if (filtered.length === 0) {
        md += `> **Sin promociones ni descuentos** para **${fuel}** en este momento.\n\n`;
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

  const handleMasterAnalysis = async () => {
    setIsAiLoading(true);
    setIsPreCalculated(false);
    setBrandAnalysis(null);

    try {
      const typeKey = selectedFuels.length === 1 ? selectedFuels[0].toLowerCase() : 'global';
      const locKey = selectedLocation.toLowerCase();
      const response = await fetch(`${supabaseUrl}/rest/v1/analisis_ia?tipo=eq.${typeKey}&localidad=eq.${locKey}&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setAiAnalysis(data[0].contenido);
          setIsPreCalculated(true);
          setIsAiLoading(false);
          return;
        }
      }
    } catch (err) {}

    await analyzeAllBrandsAi();
  };

  const handleBrandAnalysis = async () => {
    const file = files.find(f => f.id === activeFileId);
    if (!file) return;
    setIsAiLoading(true);
    const context = generateMarkdownForActive(file.brand, file.items);
    const result = await callGemini(context, `Analiza los beneficios de la marca ${file.brand} específicamente para ${selectedFuels.join(' y ')}. Resume 3 estrategias de ahorro clave para este usuario.`);
    setBrandAnalysis(result);
  };

  const analyzeAllBrandsAi = async () => {
    if (files.length === 0) return;
    const allContext = files.map(f => `ESTACIÓN: ${f.brand}\n${generateMarkdownForActive(f.brand, f.items)}`).join('\n\n---\n\n');
    const result = await callGemini(allContext, `Actúa como un experto en ahorro de combustibles en Argentina. Genera un ranking de las mejores promociones considerando combustible ${selectedFuels.join(', ')} y zona ${selectedLocation}. Prioriza mayor porcentaje y tope de reintegro.`);
    setAiAnalysis(result);
  };

  const callGemini = async (prompt, systemInstruction = "") => {
    if (!apiKey) {
      setIsAiLoading(false);
      return "Configura tu API Key de Gemini para ver el análisis inteligente.";
    }
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
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Análisis no disponible.";
    } catch (error) {
      setIsAiLoading(false);
      return "No se pudo completar el análisis inteligente en este momento.";
    }
  };

  const getBrandLogo = (brand) => {
    const b = brand.toUpperCase();
    const url = BRAND_LOGOS[b];
    if (url) return <img src={url} alt={brand} className="h-6 w-auto object-contain mix-blend-multiply dark:mix-blend-normal rounded-sm" />;
    return <Fuel size={18} className="text-blue-500" />;
  };

  const renderMd = (content) => ({ __html: marked(content || '') });

  if (!isAuthenticated && appPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Lock className="text-white w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Surtidor AI</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Contraseña..." className="w-full bg-slate-50 p-4 rounded-2xl text-center text-sm font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all" autoFocus />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-widest text-[11px]">Entrar <ArrowRight size={16} /></button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header Premium 3 Líneas */}
      <header className={`sticky top-0 z-40 border-b shadow-sm ${isDarkMode ? 'bg-slate-950/90 border-slate-900' : 'bg-white/95 border-slate-200'} backdrop-blur-lg`}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
          
          {/* LÍNEA 1: Logo y Controles */}
          <div className="flex items-center justify-between">
            <LogoSurtidorAI />
            <div className="flex items-center gap-4">
              {lastUpdateDate && (
                <div className="hidden md:flex items-center gap-2 bg-slate-500/5 px-3 py-1.5 rounded-full border border-slate-500/10">
                  <Calendar size={14} className="text-blue-600" />
                  <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter italic">DB: {lastUpdateDate}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDbSettings(true)} className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors text-slate-500 hover:text-blue-500"><Settings size={20}/></button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors">{isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}</button>
              </div>
            </div>
          </div>

          {/* LÍNEA 2: Estaciones de Servicio */}
          <div className="flex justify-center items-center gap-4 overflow-x-auto no-scrollbar py-2 border-y border-slate-500/5">
            {files.length > 0 ? (
              <>
                <button onClick={() => setActiveFileId(null)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all shrink-0 ${!activeFileId ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <Sparkles size={14} /> <span className="text-[10px] uppercase font-black tracking-widest">GLOBAL ✨</span>
                </button>
                {files.map(file => (
                  <button key={file.id} onClick={() => setActiveFileId(file.id)} className={`flex items-center justify-center p-2 px-4 h-10 min-w-[90px] rounded-xl border-2 transition-all shrink-0 ${activeFileId === file.id ? 'border-blue-600 bg-blue-600/5' : 'border-transparent opacity-40 hover:opacity-100 hover:bg-slate-500/5'}`}>
                    {getBrandLogo(file.brand)}
                  </button>
                ))}
              </>
            ) : <Loader2 className="animate-spin opacity-30" size={16} />}
          </div>

          {/* LÍNEA 3: Selectores de Filtro */}
          <div className="flex justify-center items-center gap-4">
            <div className="relative">
              <button onClick={() => {setIsFuelMenuOpen(!isFuelMenuOpen); setIsLocMenuOpen(false);}} className={`flex items-center gap-2 px-4 py-2 bg-slate-500/5 border border-slate-500/10 rounded-xl transition-all ${isFuelMenuOpen ? 'ring-2 ring-blue-600/20 bg-blue-600/5' : ''}`}>
                <Fuel size={16} className="text-blue-600" />
                <span className="text-[11px] font-black uppercase tracking-tight">{selectedFuels.length > 1 ? `Comb. (${selectedFuels.length})` : selectedFuels[0]}</span>
                <ChevronDown size={14} className="opacity-40" />
              </button>
              {isFuelMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-500/10 shadow-2xl z-50">
                   <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2 text-center">Máximo 2</p>
                   {fuelOptions.map(f => (
                     <button key={f} onClick={() => toggleFuel(f)} className={`w-full text-left p-2.5 rounded-lg text-[10px] font-bold transition-all mb-1 flex items-center justify-between ${selectedFuels.includes(f) ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white'}`}>
                       {f} {selectedFuels.includes(f) && <CheckCircle2 size={12}/>}
                     </button>
                   ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => {setIsLocMenuOpen(!isLocMenuOpen); setIsFuelMenuOpen(false);}} className={`flex items-center gap-2 px-4 py-2 bg-slate-500/5 border border-slate-500/10 rounded-xl transition-all ${isLocMenuOpen ? 'ring-2 ring-blue-600/20 bg-blue-600/5' : ''}`}>
                <LogoArgentina /> <span className="text-[11px] font-black uppercase tracking-tight dark:text-white">{selectedLocation}</span>
                <ChevronDown size={14} className="opacity-40" />
              </button>
              {isLocMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-500/10 shadow-2xl z-50">
                   {locations.map(l => (
                     <button key={l} onClick={() => {setSelectedLocation(l); setIsLocMenuOpen(false);}} className={`w-full text-left p-2.5 rounded-lg text-[10px] font-bold transition-all mb-1 flex items-center justify-between ${selectedLocation === l ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white'}`}>
                       {l}
                     </button>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col gap-6 pb-32">
        
        {/* Botón Refrescar Análisis */}
        <div className="flex justify-center">
          <button 
            onClick={() => {
              if (activeFileId) handleBrandAnalysis();
              else handleMasterAnalysis();
            }} 
            disabled={isAiLoading} 
            className="flex items-center gap-3 px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.15em] text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            REFRESCAR ANÁLISIS ✨
          </button>
        </div>

        {/* Visor Principal */}
        <div className={`rounded-[2.5rem] border shadow-2xl overflow-hidden min-h-[70vh] ${isDarkMode ? 'bg-slate-900 border-slate-800/50' : 'bg-white border-slate-100'}`}>
          <div className="h-full overflow-y-auto p-8 md:p-14 custom-scrollbar">
            
            {!activeFileId ? (
              /* VISTA GLOBAL */
              <div className="animate-in fade-in duration-700">
                {isAiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-24 opacity-20">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Analizando las mejores oportunidades del mercado...</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className={`markdown-body prose prose-slate max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                      <div className={`flex items-center gap-4 mb-10 p-6 rounded-3xl border shadow-inner ${isPreCalculated ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-blue-600/5 border-blue-600/10'}`}>
                        {isPreCalculated ? <CloudLightning className="text-emerald-500" size={32} /> : <Trophy className="text-blue-600" size={32} />}
                        <div>
                          <p className={`m-0 text-sm font-black italic uppercase leading-none mb-1 ${isPreCalculated ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {isPreCalculated ? 'Análisis Cloud Optimizado 🚀' : 'Mejores Promos del Momento ✨'}
                          </p>
                          <p className="m-0 text-[10px] opacity-60 font-medium italic">
                            {isPreCalculated ? 'Recuperado de la base de datos centralizada.' : `Análisis en vivo para ${selectedFuels.join(' + ')}.`}
                          </p>
                        </div>
                      </div>
                      <div dangerouslySetInnerHTML={renderMd(aiAnalysis)} />
                  </div>
                ) : null}
              </div>
            ) : (
              /* VISTA DE MARCA ESPECÍFICA */
              <div className="animate-in slide-in-from-right-10 duration-500">
                <div className="flex flex-col gap-6 mb-10">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600/10 rounded-2xl">
                        {getBrandLogo(files.find(f => f.id === activeFileId)?.brand || '')}
                      </div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none dark:text-white">Beneficios {files.find(f => f.id === activeFileId)?.brand}</h2>
                   </div>

                   {brandAnalysis && (
                     <div className="bg-blue-500/5 p-6 rounded-[2rem] border border-blue-500/10">
                        <div className="flex items-center gap-2 mb-3 text-blue-600">
                           <Sparkles size={16}/>
                           <span className="text-[10px] font-black uppercase tracking-widest">Estrategia de Marca ✨</span>
                        </div>
                        <div className={`markdown-body prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`} dangerouslySetInnerHTML={renderMd(brandAnalysis)} />
                     </div>
                   )}

                   {isAiLoading && !brandAnalysis && (
                      <div className="flex items-center gap-3 p-4 bg-slate-500/5 rounded-2xl animate-pulse">
                        <Loader2 className="animate-spin text-blue-500" size={16} />
                        <span className="text-[10px] font-black uppercase opacity-40">Gemini analizando beneficios de marca...</span>
                      </div>
                   )}
                </div>

                <div className={`markdown-body prose prose-slate max-w-none ${isDarkMode ? 'prose-invert' : ''}`} 
                  dangerouslySetInnerHTML={renderMd(generateMarkdownForActive(files.find(f => f.id === activeFileId)?.brand || '', files.find(f => f.id === activeFileId)?.items || []))} 
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        .markdown-body h1 { font-size: 2.5rem; font-weight: 950; color: #3b82f6; margin-bottom: 2rem; letter-spacing: -0.05em; font-style: italic; text-transform: uppercase; line-height: 0.9; }
        .markdown-body h2 { font-size: 1.5rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #3b82f6; border-bottom: 1px solid rgba(128,128,128,0.1); padding-bottom: 0.5rem; }
        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 1.5rem 0; border: 1px solid rgba(128,128,128,0.1); border-radius: 1.8rem; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }
        .markdown-body th, .markdown-body td { padding: 18px 24px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid rgba(128,128,128,0.05); }
        .markdown-body th { background: rgba(59, 130, 246, 0.06); color: #3b82f6; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.65rem; }
        .markdown-body tr:last-child td { border-bottom: none; }
        .markdown-body tr:hover { background: rgba(59, 130, 246, 0.02); }
        .markdown-body strong { color: #3b82f6; font-weight: 900; }
        .markdown-body blockquote { border-left: 8px solid #3b82f6; background: rgba(59, 130, 246, 0.04); padding: 1.5rem 2rem; margin: 2.5rem 0; border-radius: 0 2rem 2rem 0; font-style: italic; }
      `}</style>
    </div>
  );
};

export default App;
