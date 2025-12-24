import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Moon, Sun, CheckCircle2, Sparkles, Loader2, Fuel, CloudLightning, 
  Calendar, Lock, ArrowRight, Trophy, MessageSquare, X, Send, ThumbsUp, Star, LayoutDashboard, ChevronLeft, LogOut
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
      <p className="text-blue-600 font-black text-[10px] leading-none tracking-widest uppercase">AI</p>
    </div>
  </div>
);

const App = () => {
  const getSafeEnv = (key, fallback = "") => {
    try {
      const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
      return env[key] || fallback;
    } catch (e) { return fallback; }
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
  const [allFeedback, setAllFeedback] = useState([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const [selectedFuels, setSelectedFuels] = useState(['Nafta Super']);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

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
          // Seguridad extra: enviamos la clave en un header custom para la política RLS
          'x-admin-password': appPassword 
        }
      });
      const data = await response.json();
      setAllFeedback(data || []);
    } catch (e) { console.error(e); }
    setIsLoadingFeedback(false);
  };

  useEffect(() => { syncFromSupabase(); }, []);
  useEffect(() => { if (viewMode === 'admin' && isAuthenticated) fetchFeedback(); }, [viewMode, isAuthenticated]);

  const sortBeneficios = (items) => {
    return [...items].sort((a, b) => (b.descuento - a.descuento) || (b.tope - a.tope));
  };

  const generateMarkdownTable = (brand, items) => {
    if (!items || items.length === 0) return `# Beneficios ${brand}\n\n> No hay beneficios disponibles actualmente.`;
    let md = `# Beneficios ${brand}\n\n`;
    selectedFuels.forEach(fuel => {
      let filtered = items.filter(item => 
        (item.combustible || '').toLowerCase().includes('todos') || 
        (item.combustible || '').toLowerCase().includes(fuel.toLowerCase())
      );
      const sorted = sortBeneficios(filtered);
      md += `## Combustible: ${fuel}\n\n`;
      if (sorted.length === 0) md += `> Sin promociones vigentes para **${fuel}**.\n\n`;
      else {
        md += `| Banco / Billetera | Medio Pago | Día | % Desc. | Tope |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        sorted.forEach(i => md += `| **${i.banco}** | ${i.medio_pago} | ${i.dia} | **${i.descuento}%** | $${i.tope} |\n`);
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
    let md = `# 🏆 Panorama General de Ahorro\n\n| Estación | Banco | % Desc. | Tope |\n| :--- | :--- | :--- | :--- |\n`;
    sorted.forEach(i => md += `| **${i.brand}** | ${i.banco} | **${i.descuento}%** | $${i.tope} |\n`);
    md += `\n--- \n\n ### 💡 Resumen por Estación\n`;
    BRAND_ORDER.forEach(b => {
        const data = currentFiles.find(f => f.brand === b);
        if (data) {
            const top = sortBeneficios(data.items)[0];
            if (top) md += `* En **${b}**, la mejor opción es **${top.banco}** con un **${top.descuento}%**.\n`;
        }
    });
    return md;
  };

  const handleAiConsult = async () => {
    if (!userPrompt.trim()) return;
    if (!geminiApiKey) { setAiResponse("⚠️ **Configuración:** Revisa las variables en Netlify."); return; }
    setIsAiConsulting(true);
    setAiResponse(null);
    const context = files.map(f => `MARCA ${f.brand}:\n${f.items.map(i => `- ${i.banco} (${i.medio_pago}): ${i.descuento}% desc, tope $${i.tope}`).join('\n')}`).join('\n\n');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Experto en ahorro combustible Argentina. DIRECTO. SIN SALUDOS. TABLAS PRIORIDAD. 1. ### 🎯 Plan Acción (Tabla). 2. ### 💡 Pasos Clave. 3. ### 💰 Ahorro Estimado.\n\nDatos:\n\n${context}\n\nConsulta: "${userPrompt}".` }] }]
        })
      });
      const data = await response.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude procesar la respuesta.");
    } catch (e) { setAiResponse("Error de IA."); }
    setIsAiConsulting(false);
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || feedbackRating === 0) return;
    setIsSendingFeedback(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/comentarios`, {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: feedbackText, calificacion: feedbackRating, interaccion_ia: !!aiResponse })
      });
      setFeedbackSent(true);
      setFeedbackText("");
      setFeedbackRating(0);
    } catch (e) {}
    setIsSendingFeedback(false);
  };

  const handleMasterAnalysis = async () => {
    if (files.length === 0) return;
    setIsAiLoading(true);
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/analisis_ia?tipo=eq.global&select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const data = await resp.json();
      if (data && data.length > 0) setAiAnalysis(data[0].contenido);
      else setAiAnalysis(generateLocalRanking());
    } catch (e) { setAiAnalysis(generateLocalRanking()); }
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (files.length > 0 && !activeFileId && !aiAnalysis) handleMasterAnalysis();
  }, [files, activeFileId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === appPassword && appPassword !== "") setIsAuthenticated(true);
    else alert("Acceso denegado.");
  };

  if (!isAuthenticated && appPassword !== "") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 animate-pulse"><Lock className="text-white w-10 h-10" /></div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase">Surtidor AI</h2>
          <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-8">Acceso Privado</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Contraseña..." className="w-full bg-slate-50 p-4 rounded-2xl text-center font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all" autoFocus />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-widest text-[11px]">Desbloquear <ArrowRight size={16} /></button>
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
            <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button onClick={() => setViewMode(viewMode === 'app' ? 'admin' : 'app')} className={`p-2 rounded-lg transition-all ${viewMode === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-600'}`}>
                      {viewMode === 'app' ? <LayoutDashboard size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <button onClick={() => { setIsAuthenticated(false); setViewMode('app'); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
                  </div>
                )}
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors">{isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-600" />}</button>
            </div>
          </div>
          {viewMode === 'app' && (
            <div className="flex justify-center items-center gap-4 overflow-x-auto no-scrollbar py-1">
                <button onClick={() => setActiveFileId(null)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all shrink-0 ${!activeFileId ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}><Sparkles size={14} /> <span className="text-[10px] uppercase font-black">Global ✨</span></button>
                {files.map(f => (
                    <button key={f.id} onClick={() => setActiveFileId(f.id)} className={`flex items-center justify-center p-2 px-4 h-10 min-w-[90px] rounded-xl border-2 transition-all shrink-0 ${activeFileId === f.id ? 'border-blue-600 bg-blue-600/5' : 'border-transparent opacity-40 hover:opacity-100'}`}><img src={BRAND_LOGOS[f.brand]} alt={f.brand} className="h-6 w-auto object-contain mix-blend-multiply dark:mix-blend-normal" /></button>
                ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-32 flex flex-col gap-8">
        {viewMode === 'app' ? (
          <>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner"><MessageSquare size={20} /></div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Asistente de Ahorro</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="Ej: Tengo Banco Nación y uso Modo..." className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm outline-none focus:bg-white/20 transition-all resize-none h-24 text-white placeholder:text-white/30 font-medium" />
                        <button onClick={handleAiConsult} disabled={isAiConsulting || !userPrompt.trim()} className="w-full bg-white text-blue-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 shadow-xl shadow-blue-900/20">{isAiConsulting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Armar Plan</button>
                    </div>
                    {aiResponse && (
                        <div className="mt-8 bg-white/95 text-slate-900 p-6 rounded-3xl animate-in slide-in-from-top-4 duration-500 shadow-2xl prose prose-sm max-w-none overflow-hidden border border-slate-100">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest italic">Plan de Acción ✨</span>
                                <button onClick={() => setAiResponse(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                            </div>
                            <div className="table-responsive" dangerouslySetInnerHTML={{ __html: marked.parse(aiResponse) }} />
                        </div>
                    )}
                </div>
                <Sparkles className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 rotate-12" />
            </div>

            <div className={`rounded-[2.5rem] border shadow-2xl overflow-hidden min-h-[50vh] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="h-full p-8 md:p-14 overflow-y-auto custom-scrollbar">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 opacity-20"><Loader2 size={48} className="animate-spin mb-4" /><p className="font-black text-[10px] uppercase tracking-widest italic">Calculando...</p></div>
                ) : (
                  <div className="markdown-body prose max-w-none dark:prose-invert overflow-hidden">
                    <div className="table-responsive" dangerouslySetInnerHTML={{ __html: marked.parse(activeFileId ? generateMarkdownTable(activeBrandData?.brand, activeBrandData?.items) : aiAnalysis || "Cargando...") }} />
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-[2.5rem] border p-8 md:p-10 transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-blue-50/50 border-blue-100 shadow-inner'}`}>
                {!feedbackSent ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-2 text-blue-600"><ThumbsUp size={20} /><h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">¿Qué te pareció el servicio?</h3></div>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setFeedbackRating(star)} className={`transition-all hover:scale-125 ${feedbackRating >= star ? 'text-yellow-500' : 'text-slate-300 dark:text-slate-700'}`}><Star size={32} fill={feedbackRating >= star ? "currentColor" : "none"} /></button>
                            ))}
                        </div>
                        <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Tu opinión nos ayuda a mejorar..." className={`w-full p-4 rounded-2xl text-sm outline-none border-2 transition-all resize-none h-24 font-medium ${isDarkMode ? 'bg-slate-900 border-slate-800 focus:border-blue-600 text-white' : 'bg-white border-slate-200 focus:border-blue-600 shadow-sm'}`} />
                        <button onClick={handleSendFeedback} disabled={isSendingFeedback || !feedbackText.trim() || feedbackRating === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[11px] disabled:opacity-50">Enviar Mi Feedback</button>
                    </div>
                ) : (
                    <div className="text-center py-6 animate-in zoom-in-95 duration-500"><div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-500/20"><CheckCircle2 size={32} /></div><h3 className="text-xl font-black uppercase italic tracking-tighter text-emerald-600">¡Recibido!</h3></div>
                )}
            </div>
          </>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-8 border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase dark:text-white text-blue-600">Feedback Privado</h2>
              <button onClick={fetchFeedback} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"><Sparkles size={18} /></button>
            </div>
            {isLoadingFeedback ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-20"><Loader2 size={48} className="animate-spin mb-4" /></div>
            ) : (
                <div className="flex flex-col gap-4">
                    {allFeedback.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none animate-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-4"><div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} size={14} fill={item.calificacion >= s ? "#eab308" : "none"} className={item.calificacion >= s ? "text-yellow-500" : "text-slate-200 dark:text-slate-800"} />)}</div><span className="text-[9px] font-black opacity-30 uppercase italic">{new Date(item.created_at).toLocaleString()}</span></div>
                            <p className="text-sm font-medium leading-relaxed dark:text-slate-300 italic">"{item.texto}"</p>
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
        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.5rem 0; border-radius: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.85rem; background: white; }
        .markdown-body th, .markdown-body td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .markdown-body th { background: #f8fafc; font-weight: 900; text-transform: uppercase; font-size: 0.65rem; color: #3b82f6; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        .markdown-body tr:nth-child(even) { background-color: #f9fafb; }
        .markdown-body tr:hover { background-color: rgba(59, 130, 246, 0.03); transition: background 0.2s ease; }
        .markdown-body strong { color: #3b82f6; font-weight: 950; }
        .markdown-body h1 { font-size: 2.2rem; font-weight: 950; color: #3b82f6; margin-bottom: 2rem; font-style: italic; text-transform: uppercase; line-height: 1; border:none; letter-spacing: -0.05em; }
        .markdown-body h2 { font-size: 1.4rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 1rem; color: #3b82f6; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem; }
        .dark .table-responsive { border-color: #334155; }
        .dark .markdown-body table { background: #0f172a; }
        .dark .markdown-body th { background: #1e293b; color: #60a5fa; border-bottom-color: #334155; }
        .dark .markdown-body td { border-bottom-color: #1e293b; color: #cbd5e1; }
        .dark .markdown-body tr:nth-child(even) { background-color: rgba(255, 255, 255, 0.02); }
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
    if (!isGoogleCanvas && !rootElement.hasChildNodes()) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(<App />);
    }
  }
}
