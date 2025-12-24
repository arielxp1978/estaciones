import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Moon, Sun, CheckCircle2, Sparkles, Loader2, Fuel, MapPin,
  Lock, ArrowRight, MessageSquare, X, Send, ThumbsUp, Star, LayoutDashboard, ChevronLeft, LogOut, AlertCircle, TrendingUp, BadgePercent, Calendar, ChevronDown
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

const FUEL_OPTIONS = ['Nafta Super', 'Nafta Premium', 'Diesel', 'GNC'];
const LOCATION_OPTIONS = ['Todo el país', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza'];

const LogoSurtidorAI = ({ onClick }) => (
  <button onClick={onClick} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
    <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg">
      <Fuel className="text-white w-6 h-6" />
    </div>
    <div className="leading-none text-left">
      <h1 className="font-black text-lg italic tracking-tighter dark:text-white uppercase leading-none text-slate-800">SURTIDOR</h1>
      <p className="text-blue-600 font-black text-[10px] leading-none tracking-widest uppercase">AI</p>
    </div>
  </button>
);

const App = () => {
  const getSafeEnv = (key, fallback = "") => {
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
  const geminiApiKey = getSafeEnv('VITE_GEMINI_API_KEY_', "");

  const [files, setFiles] = useState([]); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [passwordInput, setPasswordInput] = useState('');
  const [viewMode, setViewMode] = useState('app'); 
  
  const [userPrompt, setUserPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiConsulting, setIsAiConsulting] = useState(false);

  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const [selectedFuels, setSelectedFuels] = useState(['Nafta Super']);
  const [selectedLocation, setSelectedLocation] = useState('Todo el país');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [isFuelMenuOpen, setIsFuelMenuOpen] = useState(false);
  const [isLocMenuOpen, setIsLocMenuOpen] = useState(false);

  useEffect(() => {
    try { document.title = "Surtidor AI"; } catch (e) {}
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
        
        const formatted = Object.keys(grouped).map(brand => ({
          id: `brand-${brand.toLowerCase()}`,
          brand,
          items: grouped[brand]
        })).sort((a, b) => {
            const idxA = BRAND_ORDER.indexOf(a.brand);
            const idxB = BRAND_ORDER.indexOf(b.brand);
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
        setFiles(formatted);
      }
    } catch (err) {}
  };

  const fetchFeedback = async () => {
    if (!isAuthenticated) return;
    setIsLoadingFeedback(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/comentarios?select=*&order=created_at.desc`, {
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'x-admin-password': appPassword 
        }
      });
      const data = await response.json();
      setAllFeedback(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setIsLoadingFeedback(false);
  };

  useEffect(() => { syncFromSupabase(); }, []);
  useEffect(() => { if (viewMode === 'admin' && isAuthenticated) fetchFeedback(); }, [viewMode, isAuthenticated]);

  const goHome = () => {
    setActiveFileId(null);
    setViewMode('app');
    setAiResponse(null);
  };

  const sortBeneficios = (items) => {
    return [...items].sort((a, b) => (b.descuento - a.descuento) || (b.tope - a.tope));
  };

  const BenefitCards = ({ brand, items }) => {
    const filtered = items.filter(item => 
      (item.combustible || '').toLowerCase().includes('todos') || 
      selectedFuels.some(f => (item.combustible || '').toLowerCase().includes(f.toLowerCase()))
    );
    const sorted = sortBeneficios(filtered);

    if (sorted.length === 0) return (
      <div className="py-20 text-center opacity-30 italic font-black uppercase text-xs tracking-widest">Sin beneficios para {selectedFuels.join(', ')}</div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {sorted.map((item, idx) => (
          <div key={idx} className="relative bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden hover:shadow-blue-500/10 transition-all duration-300">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-5 py-2.5 rounded-bl-[1.5rem] font-black text-2xl italic shadow-lg">
              {item.descuento}%
            </div>
            <div className="p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl">
                    <img src={BRAND_LOGOS[brand]} alt={brand} className="h-4 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Calendar size={10} /> {item.dia}
                </span>
              </div>
              <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">{item.banco}</h4>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 bg-blue-50 dark:bg-blue-900/30 inline-block px-2 py-1 rounded-lg">{item.medio_pago}</p>
              
              <div className="flex items-center justify-between mt-4 pt-5 border-t border-slate-50 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase opacity-30 leading-none mb-1">Tope máximo de reintegro</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200">${item.tope.toLocaleString()}</span>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <ArrowRight size={18} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleAiConsult = async () => {
    if (!userPrompt.trim()) return;
    if (!geminiApiKey) { setAiResponse("⚠️ Configuración pendiente."); return; }
    setIsAiConsulting(true);
    setAiResponse(null);
    const context = files.map(f => `MARCA ${f.brand}:\n${f.items.map(i => `- ${i.banco}: ${i.descuento}% desc, tope $${i.tope}`).join('\n')}`).join('\n\n');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Experto en ahorro Argentina. Solo listas directas. 1. ### 🎯 Mejor Plan. 2. ### 💡 Instrucciones. 3. ### 💰 Ahorro.\n\nDatos:\n\n${context}\n\nConsulta: "${userPrompt}"` }] }]
        })
      });
      const data = await response.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "Intenta de nuevo.");
    } catch (e) { setAiResponse("Error de IA."); }
    setIsAiConsulting(false);
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || feedbackRating === 0) return;
    setIsSendingFeedback(true);
    setFeedbackError(null);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/comentarios`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ texto: feedbackText, calificacion: feedbackRating, interaccion_ia: !!aiResponse })
      });
      if (response.ok) { setFeedbackSent(true); setFeedbackText(""); setFeedbackRating(0); }
      else { const e = await response.json(); setFeedbackError(e.message || "Error al enviar."); }
    } catch (e) { setFeedbackError("Error de red."); }
    setIsSendingFeedback(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === appPassword && appPassword !== "") setIsAuthenticated(true);
    else alert("Contraseña incorrecta.");
  };

  if (!isAuthenticated && appPassword !== "") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 animate-pulse"><Lock className="text-white w-10 h-10" /></div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-8 uppercase">Surtidor AI</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Contraseña..." className="w-full bg-slate-50 p-4 rounded-2xl text-center font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all shadow-inner" autoFocus />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-widest text-[11px]">Entrar <ArrowRight size={16} /></button>
          </form>
        </div>
      </div>
    );
  }

  const activeBrandData = activeFileId ? files.find(f => f.id === activeFileId) : null;

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <LogoSurtidorAI onClick={goHome} />
            <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button onClick={() => setViewMode(viewMode === 'app' ? 'admin' : 'app')} className={`p-2 rounded-lg transition-all ${viewMode === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'}`}>
                      {viewMode === 'app' ? <LayoutDashboard size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <button onClick={() => setIsAuthenticated(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
                  </div>
                )}
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors">{isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-600" />}</button>
            </div>
          </div>
          
          {viewMode === 'app' && (
            <div className="space-y-4">
                <div className="flex justify-center items-center gap-4 overflow-x-auto no-scrollbar py-1">
                    <button onClick={() => setActiveFileId(null)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 transition-all shrink-0 ${!activeFileId ? 'border-blue-600 bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                        <Sparkles size={14} /> <span className="text-[10px] uppercase">Ranking Global ✨</span>
                    </button>
                    {files.map(f => (
                        <button key={f.id} onClick={() => setActiveFileId(f.id)} className={`flex items-center justify-center p-2 px-5 h-11 min-w-[95px] rounded-2xl border-2 transition-all shrink-0 ${activeFileId === f.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                            <img src={BRAND_LOGOS[f.brand]} alt={f.brand} className="h-5 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
                        </button>
                    ))}
                </div>

                <div className="flex justify-center gap-3">
                    <div className="relative">
                        <button onClick={() => { setIsFuelMenuOpen(!isFuelMenuOpen); setIsLocMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-colors">
                            <Fuel size={14} /> {selectedFuels[0]} <ChevronDown size={12} />
                        </button>
                        {isFuelMenuOpen && (
                            <div className="absolute top-full mt-2 left-0 w-40 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {FUEL_OPTIONS.map(fuel => (
                                    <button key={fuel} onClick={() => { setSelectedFuels([fuel]); setIsFuelMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/30 ${selectedFuels.includes(fuel) ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'}`}>
                                        {fuel}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={() => { setIsLocMenuOpen(!isLocMenuOpen); setIsFuelMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-colors">
                            <MapPin size={14} /> {selectedLocation} <ChevronDown size={12} />
                        </button>
                        {isLocMenuOpen && (
                            <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {LOCATION_OPTIONS.map(loc => (
                                    <button key={loc} onClick={() => { setSelectedLocation(loc); setIsLocMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/30 ${selectedLocation === loc ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'}`}>
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-32 flex flex-col gap-8">
        {viewMode === 'app' ? (
          <>
            {/* ASISTENTE */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner"><MessageSquare size={20} /></div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Asistente de Ahorro</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="Ej: Tengo Banco Nación y uso Modo..." className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm outline-none focus:bg-white/20 transition-all resize-none h-24 text-white placeholder:text-white/30 font-medium" />
                        <button onClick={handleAiConsult} disabled={isAiConsulting || !userPrompt.trim()} className="w-full bg-white text-blue-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 shadow-xl shadow-blue-900/30">
                            {isAiConsulting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Armar Plan Personalizado
                        </button>
                    </div>
                    {aiResponse && (
                        <div className="mt-8 bg-white/95 text-slate-900 p-7 rounded-[2rem] animate-in slide-in-from-top-4 duration-500 shadow-2xl border-l-8 border-blue-600">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest italic flex items-center gap-2"><BadgePercent size={14}/> Estrategia IA sugerida</span>
                                <button onClick={() => setAiResponse(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                            </div>
                            <div className="markdown-body prose-sm" dangerouslySetInnerHTML={{ __html: marked.parse(aiResponse) }} />
                        </div>
                    )}
                </div>
                <Sparkles className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 rotate-12" />
            </div>

            {/* CONTENIDO PRINCIPAL: INFOGRAFÍA / CARDS */}
            <div className={`rounded-[2.5rem] p-8 md:p-12 shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'}`}>
              <div className="flex items-center justify-between mb-8 border-b pb-6 border-slate-50 dark:border-slate-800">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase text-blue-600 leading-none">
                    {activeBrandData ? activeBrandData.brand : "Ranking de Ahorro"}
                  </h2>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-30 mt-2">Basado en tu selección de combustible</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl text-[9px] font-black text-blue-600 uppercase tracking-widest italic shadow-sm">
                  <TrendingUp size={14} /> Recomendado
                </div>
              </div>

              {activeBrandData ? (
                <BenefitCards brand={activeBrandData.brand} items={activeBrandData.items} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {files.flatMap(f => f.items.map(i => ({...i, brand: f.brand})))
                    .filter(item => (item.combustible || '').toLowerCase().includes('todos') || selectedFuels.some(sf => (item.combustible || '').toLowerCase().includes(sf.toLowerCase())))
                    .sort((a,b) => b.descuento - a.descuento)
                    .slice(0, 10)
                    .map((item, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-7 rounded-[2rem] border-2 border-transparent hover:border-blue-600/10 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm">
                            <img src={BRAND_LOGOS[item.brand]} className="h-4 w-auto object-contain" alt={item.brand} />
                          </div>
                          <span className="text-2xl font-black text-blue-600 italic group-hover:scale-110 transition-transform">-{item.descuento}%</span>
                        </div>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tighter mb-1 leading-tight">{item.banco}</h4>
                        <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">{item.medio_pago}</p>
                        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Calendar size={12} /> {item.dia}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
              
              <div className="mt-12 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20">Última sincronización: {lastUpdateDate || '---'}</p>
              </div>
            </div>

            {/* FEEDBACK */}
            <div className={`rounded-[2.5rem] border p-10 transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-blue-50/50 border-blue-100 shadow-inner'}`}>
                {!feedbackSent ? (
                    <div className="flex flex-col gap-8">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-blue-600 mb-1">Tu experiencia importa</h3>
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Ayúdanos a mejorar el comparador</p>
                        </div>
                        <div className="flex justify-center md:justify-start items-center gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setFeedbackRating(star)} className={`transition-all hover:scale-125 ${feedbackRating >= star ? 'text-yellow-500 drop-shadow-lg' : 'text-slate-300 dark:text-slate-700'}`}>
                                    <Star size={36} fill={feedbackRating >= star ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                        <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="¿Te sirvieron los datos? ¿Algún banco que falte?" className={`w-full p-5 rounded-[1.5rem] text-sm outline-none border-2 transition-all h-28 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-800 focus:border-blue-600 text-white' : 'bg-white border-slate-200 focus:border-blue-600 shadow-sm'}`} />
                        {feedbackError && <div className="text-red-500 text-[10px] font-black uppercase flex items-center gap-2 bg-red-50 p-3 rounded-xl"><AlertCircle size={14}/> {feedbackError}</div>}
                        <button onClick={handleSendFeedback} disabled={isSendingFeedback || !feedbackText.trim() || feedbackRating === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-[0.2em] text-[11px] disabled:opacity-50">Enviar Feedback</button>
                    </div>
                ) : (
                    <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-emerald-500/30">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-emerald-600">¡Muchas Gracias!</h3>
                        <button onClick={() => setFeedbackSent(false)} className="mt-6 text-[10px] uppercase font-black text-blue-600 hover:underline tracking-widest">Enviar otra opinión</button>
                    </div>
                )}
            </div>
          </>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-8 border-b pb-4 border-slate-100 dark:border-slate-800 text-blue-600">Feedback Privado</h2>
            {isLoadingFeedback ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48}/></div> : (
              <div className="flex flex-col gap-5">
                {allFeedback.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} size={14} fill={item.calificacion >= s ? "#eab308" : "none"} className={item.calificacion >= s ? "text-yellow-500" : "text-slate-200 dark:text-slate-800"} />)}</div>
                        <span className="text-[9px] font-black opacity-30 uppercase italic">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic text-slate-700 dark:text-slate-300">"{item.texto}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        
        .markdown-body strong { color: #3b82f6; font-weight: 950; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-size: 1.1rem; font-weight: 950; color: #3b82f6; margin-bottom: 1.2rem; text-transform: uppercase; border:none; letter-spacing: -0.02em; font-style: italic; }
        .markdown-body ul { list-style: none; padding-left: 0; }
        .markdown-body li { padding: 1.2rem; margin-bottom: 0.8rem; background: rgba(59, 130, 246, 0.04); border-radius: 1.8rem; border-left: 5px solid #3b82f6; font-size: 0.85rem; font-weight: 600; color: #1e293b; line-height: 1.5; }
        
        .dark .markdown-body h1, .dark .markdown-body h2, .dark .markdown-body h3 { color: #60a5fa; }
        .dark .markdown-body li { background: rgba(255, 255, 255, 0.03); color: #cbd5e1; }
      `}</style>
    </div>
  );
};

// MONTAJE FINAL PARA VITE
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

export default App;
