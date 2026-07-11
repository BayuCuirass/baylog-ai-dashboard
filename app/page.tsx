"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { LayoutDashboard, Wand2, Copy, Check, MessageSquare, Clapperboard, Loader2, Download, Database, Zap, ArrowRight, ClipboardPaste, Search, History, Heart, Sparkles } from "lucide-react"

// --- TYPES ---
type Scene = { scene_number: number; visual: string; voiceover: string; }
type GenerateResult = {
  youtube_title: string; youtube_description: string; youtube_tags: string;
  hook: { text: string; visual: string; }; scenes: Scene[];
  outro: { text: string; visual: string; }; facebook_caption: string;
}
type QuizResult = {
  question: string; options: string[]; correct_answer: string; sweet_message: string;
}
type GlobalHistoryItem = {
  id: number; type: 'Long' | 'Shorts' | 'B-Roll' | 'Quiz';
  title: string; preview: string; timestamp: string; fullData: any;
}

const AIVideo = ({ prompt, index }: { prompt: string; index: number | string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedStatus, setSavedStatus] = useState('');
  
  const getDeterministicPage = () => {
    let hash = 0; const str = prompt + String(index);
    for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
    return (Math.abs(hash) % 8) + 1; 
  };

  const [pageNumber] = useState(getDeterministicPage());
  const videoUrl = `/api/image_proxy?prompt=${encodeURIComponent(prompt)}&page=${pageNumber}`;

  const handleSaveToD = async () => {
    setIsDownloading(true); setSavedStatus('');
    try {
      const res = await fetch('/api/save_local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, page: pageNumber, index }) });
      const data = await res.json();
      if (data.success) { setSavedStatus('Masuk D:!'); setTimeout(() => setSavedStatus(''), 3000); } 
      else { alert("Gagal: " + data.error); }
    } catch (e) { alert("Server error!"); } finally { setIsDownloading(false); }
  };

  return (
    <div className="flex flex-col gap-2 mt-3 w-full">
      <div className="relative w-full h-[240px] rounded-xl overflow-hidden border-2 border-slate-800 bg-black flex items-center justify-center">
        <video key={videoUrl} src={videoUrl} autoPlay loop muted playsInline preload="auto" className="object-cover w-full h-full opacity-70 hover:opacity-100 transition-opacity" />
      </div>
      <Button variant="outline" onClick={handleSaveToD} disabled={isDownloading} className={`w-full h-10 font-bold ${savedStatus ? 'bg-green-600 hover:bg-green-700 text-white border-none' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
        {isDownloading ? <Loader2 className="animate-spin" /> : savedStatus ? <Check size={16} className="mr-2" /> : <Download size={16} className="mr-2" />}
        {savedStatus || 'Save ke D:'}
      </Button>
    </div>
  );
};

// --- KOMPONEN NASKAH (Sederhana: 1 Tombol Copy & Video Outro) ---
const ScriptRenderer = ({ result, copied, onCopy }: { result: GenerateResult; copied: { [key: string]: boolean }; onCopy: (text: string, key: string) => void; }) => {
  const [commentInput, setCommentInput] = useState('');
  const [replyResult, setReplyResult] = useState<{edukatif: string, asik: string, singkat: string} | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  if (!result) return null;
  const combinedDescription = `${result.youtube_description}\n\n================\nJangan lupa Like, Komen, dan Subscribe!\n\nTags:\n${result.youtube_tags}`;

  const handleGenerateReply = async () => {
    if (!commentInput) return;
    setIsReplying(true);
    try {
      const res = await fetch('/api/generate', { 
        method: 'POST', 
        body: JSON.stringify({ mode: 'reply', commentText: commentInput, topic: result.youtube_title }) 
      });
      const data = await res.json();
      setReplyResult(data);
    } catch (error) { alert("Gagal balasan"); }
    setIsReplying(false);
  };

  return (
    <div className="flex flex-col gap-6 mt-4 animate-in fade-in">
      <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
        <div><h3 className="font-black text-2xl">{result.youtube_title}</h3><p className="text-indigo-200 text-sm mt-1">Naskah Siap Dieksekusi!</p></div>
        
        <div className="bg-indigo-700/50 p-4 rounded-xl border border-indigo-500/30 flex flex-col gap-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">📝 Ringkasan Cerita (Deskripsi)</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onCopy(result.youtube_description, 'desc')} className="bg-white text-indigo-700 hover:bg-indigo-50 h-8 text-xs font-bold shadow-sm">
                {copied['desc'] ? <Check size={14} className="mr-1 text-green-600"/> : <Copy size={14} className="mr-1"/>} Copy Ringkasan
              </Button>
              <Button size="sm" onClick={() => onCopy(combinedDescription, 'descTags')} className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs font-bold shadow-md border border-emerald-400">
                {copied['descTags'] ? <Check size={14} className="mr-1"/> : <ClipboardPaste size={14} className="mr-1"/>} Copy Deskripsi + Tags
              </Button>
            </div>
          </div>
          <p className="text-sm font-medium text-indigo-100 leading-relaxed whitespace-pre-wrap">{result.youtube_description}</p>
        </div>

        <div className="bg-indigo-700/50 p-4 rounded-xl border border-indigo-500/30 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">🏷️ YouTube Tags (Koma)</span>
            <Button size="sm" variant="secondary" onClick={() => onCopy(result.youtube_tags, 'tags')} className="bg-transparent text-indigo-300 hover:text-white border-indigo-400/50 h-7 text-xs">
              {copied['tags'] ? <Check size={12} className="mr-1 text-green-500"/> : <Copy size={12} className="mr-1"/>} Copy Tags Saja
            </Button>
          </div>
          <p className="text-sm font-medium text-indigo-100/70 leading-relaxed break-words italic">{result.youtube_tags}</p>
        </div>
      </div>
      
      <Card className="border-l-4 border-l-amber-500 shadow-md">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1"><span className="bg-amber-600 text-white text-[10px] px-3 py-1 rounded-full font-black mb-3 inline-block">HOOK</span><AIVideo prompt={result.hook.visual} index="Hook" /></div>
          <div className="col-span-2 flex items-center"><p className="text-xl font-bold text-slate-800 italic leading-relaxed">"{result.hook.text}"</p></div>
        </CardContent>
      </Card>

      {result.scenes.map((s, i) => (
        <Card key={i} className="shadow-md overflow-hidden">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-6 md:w-1/3 border-r bg-white flex flex-col"><span className="bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full font-black self-start mb-3">Scene {s.scene_number}</span><AIVideo prompt={s.visual} index={`Scene-${s.scene_number}`} /></div>
            <div className="p-6 md:w-2/3 bg-slate-50 flex flex-col">
              <p className="text-[15px] font-medium text-slate-700 leading-loose mb-6">"{s.voiceover}"</p>
              <div className="bg-indigo-100/50 p-4 rounded-xl border border-indigo-100 mt-auto">
                <p className="text-[10px] font-bold text-indigo-800 mb-2">✂️ VOICEOVER TEKS</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onCopy(s.voiceover, `scene_${i}`)} className="bg-white text-xs shadow-sm h-7 font-bold">
                    {copied[`scene_${i}`] ? <Check size={12} className="mr-1 text-green-600"/> : <Copy size={12} className="mr-1"/>} Copy Teks Scene {s.scene_number}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {result.outro && (
        <Card className="border-l-4 border-l-emerald-500 shadow-md bg-emerald-50/50 mb-8">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <span className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-full font-black mb-3 inline-block">OUTRO (CTA)</span>
              {result.outro.visual && <AIVideo prompt={result.outro.visual} index="Outro" />}
            </div>
            <div className="col-span-2 flex flex-col justify-center">
              <p className="text-xl font-bold text-slate-800 italic leading-relaxed">"{result.outro.text}"</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onCopy(result.outro.text, 'outro')} className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 h-9 font-bold bg-white">
                  {copied['outro'] ? <Check size={14} className="mr-2 text-emerald-600"/> : <Copy size={14} className="mr-2"/>} Copy Teks Outro
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- FITUR AUTO-REPLY TERINTEGRASI DI BAWAH NASKAH --- */}
      <Card className="border-2 border-blue-200 shadow-lg bg-blue-50/30">
        <CardContent className="p-6 flex flex-col gap-4">
          <h4 className="font-black text-blue-700 flex items-center gap-2 text-lg"><MessageSquare size={20}/> Balas Komentar (Profesional & Santai)</h4>
          <Textarea 
            className="w-full p-4 border border-blue-200 rounded-xl bg-white shadow-inner" 
            rows={2} placeholder="Paste komentar penonton di sini..." 
            value={commentInput} onChange={(e) => setCommentInput(e.target.value)} 
          />
          <Button onClick={handleGenerateReply} disabled={isReplying || !commentInput} className="bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-white font-bold w-full md:w-auto self-start px-8">
            {isReplying ? <Loader2 className="animate-spin mr-2"/> : "Generate Balasan Pintar"}
          </Button>

          {replyResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-indigo-500 shadow-sm"><p className="text-[11px] font-black text-indigo-500 mb-1 uppercase tracking-wider">🎓 Edukatif</p><p className="text-sm font-medium text-slate-700">{replyResult.edukatif}</p></div>
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-yellow-500 shadow-sm"><p className="text-[11px] font-black text-yellow-600 mb-1 uppercase tracking-wider">☕ Santai (Asik)</p><p className="text-sm font-medium text-slate-700">{replyResult.asik}</p></div>
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-green-500 shadow-sm"><p className="text-[11px] font-black text-green-600 mb-1 uppercase tracking-wider">🙌 Singkat</p><p className="text-sm font-medium text-slate-700">{replyResult.singkat}</p></div>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
};

export default function Dashboard() {
  const [activeSidebar, setActiveSidebar] = useState<'genLong' | 'genShorts' | 'broll' | 'reply' | 'quiz' | 'history'>('genLong');
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  const [globalHistory, setGlobalHistory] = useState<GlobalHistoryItem[]>([]);
  const [topic, setTopic] = useState(""); const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // B-Roll States
  const [analyzingBRoll, setAnalyzingBRoll] = useState(false);
  const [brollKeywords, setBrollKeywords] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [manualBrollInput, setManualBrollInput] = useState(''); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reply States (Untuk menu sidebar mandiri)
  const [commentInput, setCommentInput] = useState('');
  const [replyResult, setReplyResult] = useState<{edukatif: string, asik: string, singkat: string} | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  // Quiz States
  const [quizTopic, setQuizTopic] = useState('');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isQuizzing, setIsQuizzing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('baylog_universal_history_v8');
    if (saved) setGlobalHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (item: Omit<GlobalHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: GlobalHistoryItem = { ...item, id: Date.now(), timestamp: new Date().toLocaleString('id-ID') };
    const updated = [newItem, ...globalHistory].slice(0, 10); 
    setGlobalHistory(updated);
    localStorage.setItem('baylog_universal_history_v8', JSON.stringify(updated));
  };

  const handleRestoreHistory = (item: GlobalHistoryItem) => {
    if (item.type === 'Long') { setResult(item.fullData); setActiveSidebar('genLong'); } 
    else if (item.type === 'Shorts') { setResult(item.fullData); setActiveSidebar('genShorts'); } 
    else if (item.type === 'B-Roll') { setBrollKeywords(item.fullData); setVideoPreview(null); setActiveSidebar('broll'); } 
    else if (item.type === 'Quiz') { setQuizResult(item.fullData); setShowAnswer(false); setActiveSidebar('quiz'); }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  }

  const handleGenerateScript = async (mode: 'long' | 'shorts') => {
    if (!topic) return alert("Isi topiknya dulu, Bay!");
    setIsLoading(true); setResult(null); 
    try {
      const res = await fetch("/api/generate", { method: "POST", body: JSON.stringify({ topic, prompt, mode }) });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setResult(data);
      saveToHistory({ type: mode === 'long' ? 'Shorts' : 'Long', title: data.youtube_title, preview: data.hook.text, fullData: data });
    } catch (error) { alert("Error Generate!"); }
    finally { setIsLoading(false); }
  };

  const handleGenerateStandaloneReply = async () => {
    if (!commentInput) return;
    setIsReplying(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST', body: JSON.stringify({ mode: 'reply', commentText: commentInput }) });
      const data = await res.json();
      setReplyResult(data);
    } catch (error) { alert("Gagal balasan"); }
    setIsReplying(false);
  };

  const handleGenerateQuiz = async () => {
    setIsQuizzing(true); setQuizResult(null); setShowAnswer(false);
    try {
      const res = await fetch('/api/generate', { method: 'POST', body: JSON.stringify({ mode: 'quiz', topic: quizTopic }) });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setQuizResult(data);
      saveToHistory({ type: 'Quiz', title: `Kuis Zazqya`, preview: data.question, fullData: data });
    } catch (error) { alert("Gagal bikin kuis!"); }
    finally { setIsQuizzing(false); }
  };

  const handleBRollUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoPreview(URL.createObjectURL(file));
    setAnalyzingBRoll(true); setBrollKeywords([]);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch('/api/analyze_clip', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.keywords) {
        setBrollKeywords(data.keywords);
        saveToHistory({ type: 'B-Roll', title: `Video: ${file.name}`, preview: `Keywords: ${data.keywords.join(', ')}`, fullData: data.keywords });
      } else alert("Gagal: " + data.error);
    } catch (err) { alert("Error sistem."); } 
    finally { setAnalyzingBRoll(false); }
  };

  const handleManualBRollGenerate = () => {
    if(!manualBrollInput) return;
    const kws = manualBrollInput.split(',').map(k => k.trim()).filter(k => k);
    setBrollKeywords(kws); setVideoPreview(null);
    saveToHistory({ type: 'B-Roll', title: `Ketik Manual`, preview: `Keywords: ${kws.join(', ')}`, fullData: kws });
    setManualBrollInput('');
  };

  const brollHistoryList = globalHistory.filter(item => item.type === 'B-Roll').slice(0, 5);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shadow-sm z-10 overflow-y-auto">
        <div className="font-black text-2xl flex items-center gap-3 text-indigo-600 px-2"><Wand2 size={28} /> BayLog AI</div>
        <nav className="flex flex-col gap-2 mt-2">
          <Button variant={activeSidebar === 'genLong' ? "default" : "ghost"} onClick={() => { setActiveSidebar('genLong'); setResult(null); }} className={`justify-start gap-4 py-6 ${activeSidebar === 'genLong' ? 'bg-indigo-600 text-white' : ''}`}><LayoutDashboard size={20}/> 1. Naskah (Long)</Button>
          <Button variant={activeSidebar === 'genShorts' ? "default" : "ghost"} onClick={() => { setActiveSidebar('genShorts'); setResult(null); }} className={`justify-start gap-4 py-6 ${activeSidebar === 'genShorts' ? 'bg-indigo-600 text-white' : ''}`}><Zap size={20}/> 2. Naskah (Shorts)</Button>
          <Button variant={activeSidebar === 'broll' ? "default" : "ghost"} onClick={() => setActiveSidebar('broll')} className={`justify-start gap-4 py-6 ${activeSidebar === 'broll' ? 'bg-indigo-600 text-white' : ''}`}><Clapperboard size={20}/> 3. Auto B-Roll</Button>
          <Button variant={activeSidebar === 'reply' ? "default" : "ghost"} onClick={() => setActiveSidebar('reply')} className={`justify-start gap-4 py-6 ${activeSidebar === 'reply' ? 'bg-indigo-600 text-white' : ''}`}><MessageSquare size={20}/> 4. Auto-Reply</Button>
          
          <div className="h-px bg-slate-200 my-1"></div>
          
          <Button variant={activeSidebar === 'quiz' ? "default" : "ghost"} onClick={() => setActiveSidebar('quiz')} className={`justify-start gap-4 py-6 ${activeSidebar === 'quiz' ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-md' : 'text-pink-600 hover:bg-pink-50 hover:text-pink-700'}`}>
            <Heart size={20} className={activeSidebar === 'quiz' ? 'fill-white' : 'fill-pink-200'}/> Quiz Zazqya
          </Button>

          <div className="h-px bg-slate-200 my-1"></div>
          
          <Button variant={activeSidebar === 'history' ? "default" : "ghost"} onClick={() => setActiveSidebar('history')} className={`justify-start gap-4 py-6 ${activeSidebar === 'history' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Database size={20}/> Log Riwayat</Button>
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto relative w-full">
        <div className="max-w-5xl mx-auto pb-20">
          
          {activeSidebar === 'genLong' && (
            <div className="w-full flex flex-col gap-6">
              <div><h2 className="text-3xl font-black text-slate-800">Ide & Naskah (10 Menit)</h2></div>
              <Card className="shadow-md border-none rounded-2xl bg-white"><CardContent className="flex flex-col md:flex-row gap-5 p-6">
                  <div className="flex-1"><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topik Utama..." className="py-6 rounded-xl" /></div>
                  <div className="flex-1"><Input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Instruksi..." className="py-6 rounded-xl" /></div>
                  <Button onClick={() => handleGenerateScript('long')} disabled={isLoading} className="bg-indigo-600 h-12 px-8 font-bold rounded-xl text-white">{isLoading ? "PROSES..." : "GENERATE"}</Button>
              </CardContent></Card>
              <ScriptRenderer result={result!} copied={copied} onCopy={handleCopy} />
            </div>
          )}

          {activeSidebar === 'genShorts' && (
            <div className="w-full flex flex-col gap-6">
              <div><h2 className="text-3xl font-black text-rose-600 flex items-center gap-2"><Zap/> Naskah Shorts (60 Detik)</h2></div>
              <Card className="shadow-md border-none rounded-2xl bg-rose-50 border border-rose-100"><CardContent className="flex flex-col md:flex-row gap-5 p-6">
                  <div className="flex-1"><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topik Viral..." className="py-6 rounded-xl border-rose-200" /></div>
                  <div className="flex-1"><Input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Instruksi..." className="py-6 rounded-xl border-rose-200" /></div>
                  <Button onClick={() => handleGenerateScript('shorts')} disabled={isLoading} className="bg-rose-600 hover:bg-rose-700 h-12 px-8 font-bold rounded-xl text-white">{isLoading ? "PROSES..." : "BUAT SHORTS"}</Button>
              </CardContent></Card>
              <ScriptRenderer result={result!} copied={copied} onCopy={handleCopy} />
            </div>
          )}

          {activeSidebar === 'broll' && (
            <div className="w-full flex flex-col gap-6">
              <div>
                <h2 className="text-3xl font-black text-emerald-600 flex items-center gap-3"><Clapperboard/> Smart B-Roll Finder</h2>
                <p className="text-slate-500 mt-1">Upload video AI Ibot, atau ketik kata kunci manual untuk dicarikan mentahan.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="col-span-1 flex flex-col gap-6">
                  <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" accept="video/mp4,video/quicktime" className="hidden" ref={fileInputRef} onChange={handleBRollUpload} />
                    <span className="text-4xl mb-3">📥</span>
                    <p className="text-sm font-bold text-emerald-700">Drop Video Curhatan</p>
                    <p className="text-xs text-emerald-500 mt-1">AI akan nonton & cari visualnya</p>
                  </div>

                  <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2"><Search size={14}/> Cari Cepat (Manual)</p>
                    <div className="flex flex-col gap-3">
                      <Input value={manualBrollInput} onChange={(e) => setManualBrollInput(e.target.value)} placeholder="Contoh: dark street, hujan..." className="text-sm border-slate-300" />
                      <Button onClick={handleManualBRollGenerate} className="bg-slate-800 hover:bg-slate-900 h-9 text-xs font-bold text-white w-full">Cari Mentahan</Button>
                    </div>
                  </div>

                  {brollHistoryList.length > 0 && (
                    <div className="bg-white border rounded-2xl p-4 shadow-sm">
                      <p className="text-[11px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2"><History size={14}/> Riwayat B-Roll</p>
                      <div className="flex flex-col gap-2">
                        {brollHistoryList.map(item => (
                          <Button key={item.id} variant="outline" size="sm" onClick={() => handleRestoreHistory(item)} className="justify-start truncate w-full text-xs h-9 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
                            🎥 {item.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-1 lg:col-span-2">
                  {analyzingBRoll && (<div className="h-[200px] flex flex-col items-center justify-center text-emerald-600 gap-4"><Loader2 size={40} className="animate-spin" /><p className="font-bold animate-pulse">Menonton video dan meracik prompt...</p></div>)}
                  
                  {brollKeywords.length > 0 && !analyzingBRoll && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-in fade-in">
                      <h3 className="text-base font-black text-slate-800 mb-4 border-b pb-3 uppercase flex items-center gap-2">
                        <Check className="text-emerald-500" size={18}/> Rekomendasi B-Roll Siap Download:
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {brollKeywords.map((kw, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-xl border shadow-sm">
                            <p className="text-[11px] font-black text-emerald-700 mb-2 uppercase text-center bg-emerald-100 py-1.5 rounded border border-emerald-200">{kw}</p>
                            <AIVideo prompt={kw} index={`BROLL_${i+1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {brollKeywords.length === 0 && !analyzingBRoll && (
                    <div className="h-[300px] border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm font-medium">
                      Pilih dari riwayat, drop video, atau ketik manual di samping.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSidebar === 'reply' && (
            <div className="w-full flex flex-col gap-6">
               <div><h2 className="text-3xl font-black text-blue-600 flex items-center gap-3"><MessageSquare/> AI Auto-Reply (Mandiri)</h2>
               <p className="text-slate-500 mt-1">Balas komentar dari video lain tanpa harus membuat naskah.</p></div>
              <Card className="border-2 border-blue-100 bg-white shadow-sm rounded-2xl max-w-2xl"><CardContent className="p-6">
                  <Textarea className="w-full p-4 border border-blue-200 rounded-xl bg-slate-50 mb-4" rows={3} placeholder="Paste komentar penonton..." value={commentInput} onChange={(e) => setCommentInput(e.target.value)} />
                  <Button onClick={handleGenerateStandaloneReply} disabled={isReplying || !commentInput} className="w-full bg-blue-600 h-12 rounded-xl text-white font-bold">{isReplying ? "Mikiri Balasan..." : "Generate Balasan"}</Button>
              </CardContent></Card>
              {replyResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
                   <Card className="border-l-4 border-l-indigo-500"><CardContent className="p-4"><p className="text-[11px] font-black text-indigo-700 mb-2 uppercase">🎓 Edukatif</p><p className="text-sm font-medium text-slate-700">{replyResult.edukatif}</p></CardContent></Card>
                   <Card className="border-l-4 border-l-yellow-500"><CardContent className="p-4"><p className="text-[11px] font-black text-yellow-700 mb-2 uppercase">☕ Santai (Asik)</p><p className="text-sm font-medium text-slate-700">{replyResult.asik}</p></CardContent></Card>
                   <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-[11px] font-black text-green-700 mb-2 uppercase">🙌 Singkat</p><p className="text-sm font-medium text-slate-700">{replyResult.singkat}</p></CardContent></Card>
                </div>
              )}
            </div>
          )}

          {activeSidebar === 'quiz' && (
            <div className="w-full flex flex-col gap-6 animate-in fade-in">
               <div>
                <h2 className="text-3xl font-black text-pink-600 flex items-center gap-3"><Heart className="fill-pink-600"/> Quiz Time for Zazqya!</h2>
                <p className="text-pink-400 mt-1 font-medium">Buat tebak-tebakan dadakan buat ngetes seberapa kenal pacarmu.</p>
              </div>
              <Card className="border-2 border-pink-200 bg-pink-50 shadow-sm rounded-2xl max-w-2xl">
                <CardContent className="p-6">
                  <Input 
                    value={quizTopic} 
                    onChange={e => setQuizTopic(e.target.value)} 
                    placeholder="Contoh topik: Hal yang bikin Bayu ngambek..." 
                    className="py-6 rounded-xl border-pink-300 bg-white placeholder:text-pink-300 text-pink-700 font-medium mb-3" 
                  />
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-xs font-bold text-pink-400 flex items-center mr-1">Ide Cepat:</span>
                    <Button variant="outline" size="sm" onClick={() => setQuizTopic("Reward makanan enak dari Bayu setelah Zazqya selesai dan berani kontrol di RS")} className="text-xs border-pink-200 text-pink-600 hover:bg-pink-100 rounded-full h-7">
                      🏥 Reward Habis Kontrol
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuizTopic("Tebak-tebakan hal absurd yang lagi dipikirin Zazqya pas nunggu antrean dokter")} className="text-xs border-pink-200 text-pink-600 hover:bg-pink-100 rounded-full h-7">
                      💉 Bosen Nunggu Dokter
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuizTopic("Tebak kelakuan konyol Bayu kalau lagi nemenin Zazqya")} className="text-xs border-pink-200 text-pink-600 hover:bg-pink-100 rounded-full h-7">
                      💑 Tebak Kelakuan Bayu
                    </Button>
                  </div>

                  <Button onClick={handleGenerateQuiz} disabled={isQuizzing} className="w-full bg-pink-500 hover:bg-pink-600 h-12 rounded-xl text-white font-bold shadow-md">
                    {isQuizzing ? <><Sparkles className="animate-pulse mr-2"/> Meracik Kuis Cinta...</> : <><Sparkles className="mr-2"/> Buat Pertanyaan!</>}
                  </Button>
                </CardContent>
              </Card>

              {quizResult && (
                <div className="max-w-2xl animate-in slide-in-from-bottom-4">
                  <Card className="border-2 border-pink-300 shadow-xl overflow-hidden rounded-3xl">
                    <div className="bg-pink-500 p-6 text-center text-white">
                      <p className="text-sm font-bold tracking-widest text-pink-200 mb-2 uppercase">Pertanyaan Untukmu</p>
                      <h3 className="text-2xl font-black leading-snug">"{quizResult.question}"</h3>
                    </div>
                    <CardContent className="p-6 bg-white flex flex-col gap-3">
                      {quizResult.options.map((opt, i) => (
                        <div key={i} className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${showAnswer && opt.startsWith(quizResult.correct_answer) ? 'bg-green-100 border-green-500 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          {opt}
                          {showAnswer && opt.startsWith(quizResult.correct_answer) && <Check className="inline-block ml-2 text-green-600" size={18}/>}
                        </div>
                      ))}
                      
                      {!showAnswer ? (
                        <Button onClick={() => setShowAnswer(true)} className="mt-4 w-full h-12 bg-slate-800 hover:bg-slate-900 rounded-xl font-bold text-white">
                          Buka Kunci Jawaban 🔓
                        </Button>
                      ) : (
                        <div className="mt-6 p-5 bg-pink-50 border border-pink-200 rounded-2xl text-center animate-in zoom-in">
                          <p className="text-xs font-black text-pink-400 uppercase tracking-widest mb-1">Pesan Buat Zazqya:</p>
                          <p className="text-lg font-bold text-pink-600 italic">"{quizResult.sweet_message}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeSidebar === 'history' && (
            <div className="w-full flex flex-col gap-6 animate-in fade-in">
              <div>
                <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Database/> Database Riwayat (Maks 10)</h2>
                <p className="text-slate-500 mt-1">Data lama akan otomatis terhapus jika sudah melewati batas 10 riwayat agar sistem tetap ringan.</p>
              </div>

              {globalHistory.length === 0 ? (
                <div className="bg-white border-2 border-dashed p-10 text-center rounded-2xl text-slate-400">Belum ada riwayat aktivitas. Mulai generate sesuatu!</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {globalHistory.map((item) => (
                    <Card key={item.id} onClick={() => handleRestoreHistory(item)} className="shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className={`p-3 rounded-lg text-white font-bold text-xs uppercase tracking-wider ${item.type === 'Long' ? 'bg-indigo-600' : item.type === 'Shorts' ? 'bg-rose-600' : item.type === 'B-Roll' ? 'bg-emerald-600' : item.type === 'Quiz' ? 'bg-pink-500' : 'bg-blue-600'}`}>
                          {item.type}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate text-lg group-hover:text-indigo-600 transition-colors">{item.title}</p>
                          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{item.preview}</p>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <div className="text-xs font-bold text-slate-400 whitespace-nowrap mb-2">{item.timestamp}</div>
                          <div className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Buka <ArrowRight size={12}/></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}