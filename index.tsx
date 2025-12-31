import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Play, PlusCircle, Layout, Trash2, Users, LogIn, LogOut, User as UserIcon,
  Shield, ChevronRight, XCircle, Trophy, Medal, Star, ArrowLeft, 
  Sparkles as SparklesIcon, Zap, Settings2, X as LucideX, RefreshCcw, Palette,
  CheckCircle2, Plus, Sparkles, Save, ChevronLeft, AlertCircle, Radio, Check,
  Mail, Lock, ChevronDown, Search
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
export interface User { id: string; name: string; email: string; }
export interface Answer { id: string; text: string; points: number; revealed: boolean; }
export interface Question { id: string; prompt: string; answers: Answer[]; }
export interface TeamConfig { id: string; name: string; color: string; }
export interface Game { id: string; ownerId?: string; title: string; questions: Question[]; teams: TeamConfig[]; createdAt: number; strikePenalty: number; }
export interface ActiveGame { game: Game; currentQuestionIndex: number; teamScores: Record<string, number>; teamStrikes: Record<string, number>; roundPoints: number; strikes: number; activeTeamId: string | null; roomCode: string; players: Player[]; buzzedPlayerId: string | null; }
export type GameState = 'LOBBY' | 'PLAYING' | 'SUMMARY';
export interface Player { id: string; name: string; emoji: string; accessory?: string; teamId: string; pointsContributed: number; buzzedAt?: number; }
export interface SyncedGameState { prompt: string; answers: { index: number; text?: string; points?: number; revealed: boolean }[]; teamScores: Record<string, number>; teamStrikes: Record<string, number>; teams: TeamConfig[]; players: { id: string; emoji: string; accessory?: string }[]; roundPoints: number; strikes: number; currentQuestionIndex: number; totalQuestions: number; gameState: GameState; buzzedPlayerId: string | null; strikePenalty: number; }
export type MultiplayerMessage = | { type: 'JOIN'; payload: { name: string; id: string; emoji: string; teamId: string; accessory?: string } } | { type: 'UPDATE_PROFILE'; payload: { id: string; emoji: string; accessory: string } } | { type: 'BUZZ'; payload: { playerId: string } } | { type: 'GAME_UPDATE'; payload: SyncedGameState } | { type: 'STRIKE_ANIMATION'; payload: { count: number } } | { type: 'REQUEST_SYNC' } | { type: 'RESET_BUZZER' };

// --- TRANSLATIONS ---
export type Language = 'en' | 'ru' | 'es';
export const translations = {
  en: { appName: "FEUD HOST", branding: "FAMILY FEUD", joinRoom: "Join Room", newBoard: "New Board", login: "Login", logout: "Logout", createBoard: "Create Board", getStarted: "Get Started", joinAsPlayer: "Join as Player", yourBoards: "Your Saved Boards", publicSamples: "Public Samples", questions: "QUESTIONS", createPrompt: "Create New Board", roomCode: "Room Code", yourName: "Your Name", pickTeam: "Pick a Team", joinGame: "JOIN GAME", backHome: "Back Home", connecting: "Connecting to host...", noGameFound: "No game found in this room.", strike: "Strike", clearTurn: "Clear Turn", nextQuestion: "Next Question", win: "Win", startBroadcast: "START BROADCAST", cancelSession: "Cancel Session", winnersPodium: "WINNERS PODIUM", playAgain: "Play Again", backToMenu: "Back to Menu", customize: "Customize", adjustLook: "Adjust Look", leaveGame: "Leave Game", waitingForHost: "Waiting for Host", readyToWin: "Ready to Win!", locked: "Locked! Another buzz.", buzz: "BUZZ!", wait: "WAIT", points: "POINTS", penalty: "Penalty", surveyRounds: "Survey Rounds", saveGame: "Save Game", aiAssistant: "AI Survey Assistant", createButton: "CREATE BOARD", gameTheme: "Game Theme (e.g. Marvel Movies...)", boardEditor: "BOARD EDITOR", competitors: "Competitors", roundRules: "Round Rules", strikePenalty: "3rd Strike Penalty", lostPoints: "LOST POINTS", pointsWiped: "When a team fails 3 times, these points are wiped.", welcomeBack: "Welcome Back!", accountCreated: "Account Created!", redirecting: "Redirecting to dashboard...", hostLogin: "Host Login", registerHost: "Register Host", email: "Email Address", password: "Password", displayName: "Display Name", enterDashboard: "ENTER DASHBOARD", createAccount: "CREATE ACCOUNT", newHere: "New here? Register as Host", alreadyHost: "Already a host? Log in here", },
  ru: { appName: "FEUD HOST", branding: "FAMILY FEUD", joinRoom: "Войти", newBoard: "Новая игра", login: "Вход", logout: "Выход", createBoard: "Создать игру", getStarted: "Начать", joinAsPlayer: "Играть", yourBoards: "Ваши игры", publicSamples: "Примеры игр", questions: "ВОПРОСОВ", createPrompt: "Создать новую доску", roomCode: "Код комнаты", yourName: "Ваше имя", pickTeam: "Выберите команду", joinGame: "ВСТУПИТЬ В ИГРУ", backHome: "На главную", connecting: "Подключение к ведущему...", noGameFound: "Игра в этой комнате не найдена.", strike: "Промах", clearTurn: "Сброс хода", nextQuestion: "След. вопрос", win: "Победа", startBroadcast: "НАЧАТЬ ЭФИР", cancelSession: "Отменить сессию", winnersPodium: "ПОДИУМ ПОБЕДИТЕЛЕЙ", playAgain: "Играть снова", backToMenu: "В меню", customize: "Образ", adjustLook: "Изменить вид", leaveGame: "Выйти из игры", waitingForHost: "Ожидание ведущего", readyToWin: "Готов к победе!", locked: "Заблокировано!", buzz: "ЖМИ!", wait: "ЖДИ", points: "ОЧКИ", penalty: "Штраф", surveyRounds: "Раунды опроса", saveGame: "Сохранить", aiAssistant: "ИИ Помощник", createButton: "СОЗДАТЬ ДОСКУ", gameTheme: "Тема (напр. Фильмы Марвел...)", boardEditor: "РЕДАКТОР", competitors: "Участники", roundRules: "Правила раунда", strikePenalty: "Штраф за 3 промаха", lostPoints: "МИНУС ОЧКИ", pointsWiped: "Если команда ошибается 3 раза, эти очки списываются.", welcomeBack: "С возвращением!", accountCreated: "Аккаунт создан!", redirecting: "Перенаправление...", hostLogin: "Вход для ведущего", registerHost: "Регистрация", email: "Email адрес", password: "Пароль", displayName: "Имя", enterDashboard: "ВОЙТИ В ПАНЕЛЬ", createAccount: "СОЗДАТЬ АККАУНТ", newHere: "Впервые здесь? Регистрация", alreadyHost: "Уже есть аккаунт? Войти", },
  es: { appName: "FEUD HOST", branding: "FAMILY FEUD", joinRoom: "Unirse", newBoard: "Nuevo Tablero", login: "Acceder", logout: "Salir", createBoard: "Crear Tablero", getStarted: "Comenzar", joinAsPlayer: "Unirse como Jugador", yourBoards: "Mis Tableros", publicSamples: "Ejemplos Públicos", questions: "PREGUNTAS", createPrompt: "Crear Nuevo Tablero", roomCode: "Código", yourName: "Tu Nombre", pickTeam: "Equipo", joinGame: "UNIRSE", backHome: "Inicio", connecting: "Conectando...", noGameFound: "No se encontró el juego.", strike: "Error", clearTurn: "Limpiar Turno", nextQuestion: "Siguiente", win: "Gana", startBroadcast: "INICIAR JUEGO", cancelSession: "Cancelar", winnersPodium: "PODIO DE GANADORES", playAgain: "Jugar de Nuevo", backToMenu: "Menú Principal", customize: "Personalizar", adjustLook: "Cambiar Look", leaveGame: "Salir", waitingForHost: "Esperando al Host", readyToWin: "¡Listo para ganar!", locked: "¡Bloqueado!", buzz: "¡BOTÓN!", wait: "ESPERA", points: "PUNTOS", penalty: "Penalización", surveyRounds: "Rondas", saveGame: "Guardar", aiAssistant: "Asistente IA", createButton: "CREAR JUEGO", gameTheme: "Tema (ej. Películas...)", boardEditor: "EDITOR", competitors: "Equipos", roundRules: "Reglas", strikePenalty: "Penalización por 3 fallos", lostPoints: "PUNTOS MENOS", pointsWiped: "Si el equipo falla 3 veces, pierde estos puntos.", welcomeBack: "¡Bienvenido!", accountCreated: "¡Cuenta creada!", redirecting: "Redireccionando...", hostLogin: "Iniciar Sesión", registerHost: "Registrarse", email: "Correo electrónico", password: "Contraseña", displayName: "Nombre", enterDashboard: "ENTRAR", createAccount: "CREAR CUENTA", newHere: "¿Nuevo? Regístrate", alreadyHost: "¿Ya tienes cuenta? Accede", }
};

// --- MULTIPLAYER SERVICE ---
export class MultiplayerService {
  private channel: BroadcastChannel | null = null;
  private onMessageCallback: (msg: MultiplayerMessage) => void;
  constructor(roomCode: string, onMessage: (msg: MultiplayerMessage) => void) {
    this.channel = new BroadcastChannel(`feud_room_${roomCode}`);
    this.onMessageCallback = onMessage;
    this.channel.onmessage = (event) => this.onMessageCallback(event.data);
  }
  send(message: MultiplayerMessage) { this.channel?.postMessage(message); }
  close() { this.channel?.close(); this.channel = null; }
}

// --- GEMINI SERVICE ---
export async function generateFeudGame(topic: string, lang: Language = 'en'): Promise<Game> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langPrompt = lang === 'ru' ? 'in Russian' : lang === 'es' ? 'in Spanish' : 'in English';
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a Family Feud style game for the topic: "${topic}" ${langPrompt}. Create 5 unique questions. Each question should have 6-8 popular answers with point values that roughly sum to 100. Make the answers funny, realistic, and representative of what people would actually say in a survey. IMPORTANT: All text content MUST be ${langPrompt}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, answers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, points: { type: Type.INTEGER } }, required: ["text", "points"] } } }, required: ["prompt", "answers"] } }
        },
        required: ["title", "questions"]
      }
    }
  });
  const rawData = JSON.parse(response.text.trim());
  return { id: Math.random().toString(36).substr(2, 9), title: rawData.title, createdAt: Date.now(), teams: [], strikePenalty: 25, questions: rawData.questions.map((q: any) => ({ id: Math.random().toString(36).substr(2, 9), prompt: q.prompt, answers: q.answers.map((a: any) => ({ id: Math.random().toString(36).substr(2, 9), text: a.text, points: a.points, revealed: false })) })) };
}

// --- SHARED COMPONENTS ---
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success', size?: 'sm' | 'md' | 'lg' }> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500 shadow-xl",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800 focus:ring-slate-700"
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-base", lg: "px-8 py-3.5 text-lg" };
  return <button className={`inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 active:scale-95 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

const AnswerTile: React.FC<{ answer?: Answer, index: number, onClick?: () => void, hostMode?: boolean }> = ({ answer, index, onClick, hostMode = false }) => {
  if (!answer) return <div className="h-16 bg-blue-900/30 border-2 border-blue-800 rounded shadow-inner flex items-center justify-center"><span className="text-blue-700 font-bold text-2xl">{index + 1}</span></div>;
  const isInteractive = !answer.revealed && !!onClick;
  return (
    <div onClick={isInteractive ? onClick : undefined} className={`relative h-16 w-full perspective-1000 group transition-transform duration-200 ${isInteractive ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95' : 'cursor-default'}`}>
      <div className={`absolute inset-0 w-full h-full transition-all duration-700 transform-style-3d ${answer.revealed ? 'rotate-x-180' : ''}`}>
        <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-300 rounded-lg shadow-xl overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-400 shadow-inner z-10"><span className="text-white font-bold text-2xl game-font">{index + 1}</span></div>
          {hostMode && !answer.revealed && <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none"><span className="text-white/30 font-black uppercase text-[10px] tracking-widest truncate pl-12">{answer.text}</span></div>}
        </div>
        <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-between px-4 bg-gradient-to-b from-yellow-400 to-yellow-600 border-2 border-yellow-200 rounded-lg shadow-xl text-blue-900 rotate-x-180">
          <span className="font-bold uppercase truncate pr-4 text-xl tracking-wide">{answer.text}</span><span className="font-black text-2xl game-font border-l-2 border-blue-900/20 pl-4">{answer.points}</span>
        </div>
      </div>
    </div>
  );
};

const StrikeDisplay: React.FC<{ strikes: number }> = ({ strikes }) => {
  if (strikes === 0) return null;
  return <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center gap-12 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-150">{[...Array(strikes)].map((_, i) => <div key={i} className="animate-strike flex flex-col items-center"><div className="text-[250px] leading-none text-red-600 font-black drop-shadow-[0_20px_20px_rgba(0,0,0,1)] game-font">X</div></div>)}</div>;
};

const LanguagePicker: React.FC<{ current: Language, onChange: (l: Language) => void }> = ({ current, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languages: { code: Language; label: string; flag: string }[] = [{ code: 'en', label: 'English', flag: '🇺🇸' }, { code: 'ru', label: 'Русский', flag: '🇷🇺' }, { code: 'es', label: 'Español', flag: '🇲🇽' }];
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const activeLang = languages.find(l => l.code === current) || languages[0];
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-1.5 transition-all active:scale-95 group shadow-lg"><span className="text-lg leading-none">{activeLang.flag}</span><span className="text-[10px] font-black uppercase tracking-widest text-slate-300 hidden md:block">{activeLang.code}</span><ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} /></button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 glass-effect rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 dropdown-shadow">
          <div className="py-1 px-2 mb-1 border-b border-white/5"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Language</span></div>
          {languages.map((lang) => (<button key={lang.code} onClick={() => { onChange(lang.code); setIsOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${current === lang.code ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5 text-slate-300'}`}><div className="flex items-center gap-3"><span className="text-lg leading-none">{lang.flag}</span><span className="text-sm font-bold">{lang.label}</span></div>{current === lang.code && <Check className="w-4 h-4" />}</button>))}
        </div>
      )}
    </div>
  );
};

// --- AUTH VIEW ---
const AuthView: React.FC<{ onAuthSuccess: (user: User) => void, onCancel: () => void, lang: Language }> = ({ onAuthSuccess, onCancel, lang }) => {
  const t = translations[lang];
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(''); const norm = email.toLowerCase().trim();
    if (!norm || !password || (!isLogin && !name)) { setError('Fill all fields'); return; }
    let users = []; try { const stored = localStorage.getItem('feud_users'); users = stored ? JSON.parse(stored) : []; } catch (err) { }
    if (isLogin) {
      const u = users.find((u: any) => u.email === norm && u.password === password);
      if (u) { setIsSuccess(true); setTimeout(() => onAuthSuccess({ id: u.id, name: u.name, email: u.email }), 800); } else setError('Invalid login');
    } else {
      if (users.find((u: any) => u.email === norm)) { setError('Email already registered'); return; }
      const newUser = { id: Math.random().toString(36).substr(2, 9), name: name.trim(), email: norm, password };
      users.push(newUser); localStorage.setItem('feud_users', JSON.stringify(users)); setIsSuccess(true);
      setTimeout(() => onAuthSuccess({ id: newUser.id, name: newUser.name, email: newUser.email }), 800);
    }
  };
  if (isSuccess) return (<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500"><CheckCircle2 className="w-20 h-20 text-emerald-500 animate-bounce" /><h2 className="text-3xl font-black game-font text-white uppercase tracking-widest">{isLogin ? t.welcomeBack : t.accountCreated}</h2><p className="text-slate-500">{t.redirecting}</p></div>);
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8"><div className="text-center space-y-4"><div className="inline-flex p-4 bg-blue-600 rounded-3xl mb-2 shadow-2xl shadow-blue-900/40"><Shield className="w-10 h-10 text-white" /></div><h1 className="text-5xl font-black game-font text-white uppercase tracking-tight italic">{isLogin ? t.hostLogin : t.registerHost}</h1></div><form onSubmit={handleSubmit} className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">{error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-bold text-center">{error}</div>}{!isLogin && (<div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">{t.displayName}</label><div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" /><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none transition-all" value={name} onChange={(e) => setName(e.target.value)} /></div></div>)}<div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">{t.email}</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" /><input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">{t.password}</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" /><input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} /></div></div><Button type="submit" className="w-full py-5 text-xl game-font tracking-widest uppercase">{isLogin ? t.enterDashboard : t.createAccount}</Button><button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-xs font-black text-blue-500 uppercase tracking-widest pt-2">{isLogin ? t.newHere : t.alreadyHost}</button></form><Button variant="ghost" onClick={onCancel} className="w-full text-slate-600"><ChevronLeft className="w-5 h-5 mr-2" /> {t.backHome}</Button></div>
    </div>
  );
};

// --- JOIN VIEW ---
const JoinView: React.FC<{ onJoin: (code: string, name: string, teamId: string) => void, onCancel: () => void, lang: Language }> = ({ onJoin, onCancel, lang }) => {
  const t = translations[lang];
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [availableTeams, setAvailableTeams] = useState<TeamConfig[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hostFound, setHostFound] = useState(false);
  const serviceRef = useRef<MultiplayerService | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMessage = useCallback((msg: MultiplayerMessage) => { if (msg.type === 'GAME_UPDATE') { setAvailableTeams(msg.payload.teams); setHostFound(true); setIsSearching(false); } }, []);
  useEffect(() => {
    const cleanCode = code.replace(/\D/g, ''); if (cleanCode.length < 6) { if (serviceRef.current) { serviceRef.current.close(); serviceRef.current = null; } if (searchTimeoutRef.current) { clearInterval(searchTimeoutRef.current); searchTimeoutRef.current = null; } setAvailableTeams([]); setHostFound(false); setIsSearching(false); return; }
    if (cleanCode.length === 6 && !serviceRef.current) { setIsSearching(true); const service = new MultiplayerService(cleanCode, onMessage); serviceRef.current = service; const pulse = () => { if (!hostFound) service.send({ type: 'REQUEST_SYNC' }); }; pulse(); searchTimeoutRef.current = setInterval(pulse, 2000); return () => { service.close(); if (searchTimeoutRef.current) clearInterval(searchTimeoutRef.current); }; }
  }, [code, hostFound, onMessage]);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const cc = code.replace(/\D/g, ''); if (cc.length === 6 && name.trim() && teamId) onJoin(cc, name, teamId); };
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2"><div className="inline-flex p-3 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/40"><Users className="w-8 h-8 text-white" /></div><h1 className="text-4xl font-black game-font text-white tracking-tight uppercase italic">{t.joinRoom}</h1></div>
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="space-y-2 relative"><label className="text-xs font-bold uppercase text-slate-500 tracking-widest">{t.roomCode}</label><div className="relative"><input type="text" maxLength={6} placeholder="000000" className={`w-full bg-slate-800 border-2 rounded-xl px-4 py-4 text-center text-4xl font-black game-font tracking-[0.5em] focus:outline-none transition-all shadow-inner ${hostFound ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-blue-400 focus:border-blue-500'}`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />{hostFound && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"><CheckCircle2 className="w-8 h-8" /></div>}</div></div>
          <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-500 tracking-widest">{t.yourName}</label><input type="text" placeholder="..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-center text-2xl font-bold text-white focus:border-blue-500 focus:outline-none shadow-inner" value={name} onChange={(e) => setName(e.target.value)} /></div>
          {availableTeams.length > 0 && (<div className="space-y-3"><label className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center justify-between"><span>{t.pickTeam}</span><span className="text-[10px] text-emerald-500 flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" /> Host Found</span></label><div className="grid grid-cols-2 gap-4">{availableTeams.map(team => (<button key={team.id} type="button" onClick={() => setTeamId(team.id)} className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl border-4 transition-all duration-300 transform ${teamId === team.id ? 'border-white scale-105 shadow-2xl z-10' : 'border-slate-800 opacity-40 hover:opacity-100 hover:scale-[1.02] grayscale-[0.5] hover:grayscale-0'}`} style={{ backgroundColor: team.color }}>{teamId === team.id && <div className="absolute -top-3 -right-3 bg-white text-blue-600 p-1.5 rounded-full shadow-lg border-2 border-blue-600 animate-in zoom-in"><Check className="w-4 h-4 stroke-[4]" /></div>}<div className="relative z-10 flex flex-col items-center"><div className={`p-2 rounded-full mb-2 bg-white/20 transition-transform ${teamId === team.id ? 'scale-110' : ''}`}><Shield className="w-6 h-6 text-white fill-current drop-shadow-md" /></div><span className="font-black game-font uppercase text-white truncate max-w-full text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{team.name}</span></div></button>))}</div></div>)}
          <Button type="submit" className="w-full py-6 text-2xl game-font tracking-wider shadow-[0_6px_0_rgba(0,0,0,0.2)] active:shadow-none" disabled={code.length !== 6 || !name.trim() || !teamId}>{t.joinGame}</Button>
        </form>
        <Button variant="ghost" onClick={onCancel} className="w-full"><ChevronLeft className="w-4 h-4 mr-2" /> {t.backHome}</Button>
      </div>
    </div>
  );
};

// --- GAME CREATOR ---
const PRESET_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#ea580c', '#db2777', '#0891b2'];
const GameCreator: React.FC<{ onSave: (game: Game) => void, onCancel: () => void, lang: Language }> = ({ onSave, onCancel, lang }) => {
  const t = translations[lang];
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [strikePenalty, setStrikePenalty] = useState(25);
  const [teams, setTeams] = useState<TeamConfig[]>([{ id: 't1', name: lang === 'ru' ? 'Синие' : 'Team One', color: '#2563eb' }, { id: 't2', name: lang === 'ru' ? 'Красные' : 'Team Two', color: '#dc2626' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTopic, setGenerationTopic] = useState('');
  const addTeam = () => { if (teams.length >= 8) return; setTeams([...teams, { id: `t${teams.length + 1}`, name: `${lang === 'ru' ? 'Команда' : 'Team'} ${teams.length + 1}`, color: PRESET_COLORS[teams.length % PRESET_COLORS.length] }]); };
  const removeTeam = (id: string) => { if (teams.length <= 2) return; setTeams(teams.filter(t_cfg => t_cfg.id !== id)); };
  const updateTeam = (id: string, updates: Partial<TeamConfig>) => setTeams(teams.map(t_cfg => t_cfg.id === id ? { ...t_cfg, ...updates } : t_cfg));
  const addQuestion = () => setQuestions([...questions, { id: Math.random().toString(36).substr(2, 9), prompt: '', answers: [{ id: '1', text: '', points: 0, revealed: false }, { id: '2', text: '', points: 0, revealed: false }] }]);
  const removeQuestion = (id: string) => setQuestions(questions.filter(q => q.id !== id));
  const updateQuestionPrompt = (id: string, prompt: string) => setQuestions(questions.map(q => q.id === id ? { ...q, prompt } : q));
  const addAnswer = (qId: string) => setQuestions(questions.map(q => q.id === qId ? { ...q, answers: [...q.answers, { id: Math.random().toString(36).substr(2, 9), text: '', points: 0, revealed: false }] } : q));
  const updateAnswer = (qId: string, aId: string, updates: Partial<Answer>) => setQuestions(questions.map(q => q.id === qId ? { ...q, answers: q.answers.map(a => a.id === aId ? { ...a, ...updates } : a) } : q));
  const removeAnswer = (qId: string, aId: string) => setQuestions(questions.map(q => q.id === qId ? { ...q, answers: q.answers.filter(a => a.id !== aId) } : q));
  const handleGenerate = async () => { if (!generationTopic.trim()) return; setIsGenerating(true); try { const gen = await generateFeudGame(generationTopic, lang); setTitle(gen.title); setQuestions(gen.questions); } catch (e) { alert("Failed to generate board."); } finally { setIsGenerating(false); } };
  const handleSave = () => { if (!title.trim() || questions.length === 0) { alert("Please set a title and questions."); return; } onSave({ id: Math.random().toString(36).substr(2, 9), title, questions, teams, strikePenalty, createdAt: Date.now() }); };
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-48 space-y-10 animate-in fade-in duration-500 overflow-visible">
      <div className="flex flex-col sm:flex-row items-center justify-between sticky top-[64px] bg-slate-950/95 backdrop-blur-md z-[50] py-6 border-b-2 border-slate-900 gap-4">
        <div className="flex items-center gap-5 w-full sm:w-auto"><Button variant="ghost" onClick={onCancel} className="px-3 hover:bg-slate-800 rounded-2xl flex-shrink-0 transition-colors"><ChevronLeft className="w-6 h-6 mr-1" /><span className="font-bold">Back</span></Button><h1 className="text-2xl sm:text-4xl font-black game-font text-white tracking-widest uppercase italic">{t.boardEditor}</h1></div>
        <Button onClick={handleSave} disabled={isGenerating} size="lg" className="w-full sm:w-auto px-12 py-5 rounded-2xl shadow-2xl game-font uppercase tracking-widest text-xl"><Save className="w-6 h-6 mr-2" /> {t.saveGame}</Button>
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-14 overflow-visible">
        <div className="lg:col-span-8 space-y-12">
          <section className="bg-slate-900/40 p-8 rounded-[3rem] border-2 border-slate-800 shadow-2xl space-y-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-2"><Sparkles className="w-6 h-6 text-yellow-400" /><h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">{t.aiAssistant}</h2></div>
            <div className="flex flex-col sm:flex-row gap-4"><input type="text" placeholder={t.gameTheme} className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] px-6 py-5 text-white font-bold text-lg focus:outline-none focus:border-blue-500" value={generationTopic} onChange={(e) => setGenerationTopic(e.target.value)} /><Button onClick={handleGenerate} disabled={isGenerating} className="px-10 py-5 rounded-[1.5rem] h-full game-font tracking-widest text-lg">{isGenerating ? '...' : t.createButton}</Button></div>
          </section>
          <div className="space-y-4 px-2"><label className="text-[11px] font-black uppercase text-slate-600 tracking-[0.4em] ml-2">Board Title</label><input type="text" placeholder="..." className="w-full bg-transparent border-b-4 border-slate-900 px-1 py-4 text-4xl sm:text-7xl font-black text-white focus:outline-none focus:border-blue-600 transition-all" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-12">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-slate-900 rounded-[3rem] border-2 border-slate-800 p-8 md:p-10 space-y-10 shadow-3xl relative group">
                <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="bg-blue-600 text-white w-14 h-14 flex items-center justify-center rounded-[1.25rem] font-black text-2xl">{qIndex + 1}</div><span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Question Round</span></div><button onClick={() => removeQuestion(q.id)} className="p-4 text-slate-700 hover:text-red-500"><Trash2 className="w-7 h-7" /></button></div>
                <textarea placeholder="Enter your survey question..." className="w-full bg-slate-800/20 border-2 border-slate-800 rounded-[2rem] px-8 py-7 text-white font-bold text-2xl sm:text-3xl min-h-[140px] focus:outline-none focus:border-blue-500" value={q.prompt} onChange={(e) => updateQuestionPrompt(q.id, e.target.value)} />
                <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">{q.answers.map((a, aIndex) => (<div key={a.id} className="grid grid-cols-[30px_1fr_60px_45px] items-center gap-2 bg-slate-950/50 p-3 pl-4 rounded-3xl border-2 border-slate-800/50 hover:border-slate-700 transition-all"><span className="text-blue-500 font-black text-sm">{aIndex + 1}</span><input type="text" placeholder="..." className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-white p-0" value={a.text} onChange={(e) => updateAnswer(q.id, a.id, { text: e.target.value })} /><input type="number" className="w-full bg-slate-900 border-none rounded-xl text-base font-black text-center text-yellow-500 p-2" value={a.points} onChange={(e) => updateAnswer(q.id, a.id, { points: parseInt(e.target.value) || 0 })} /><button onClick={() => removeAnswer(q.id, a.id)} className="p-2 text-slate-700 hover:text-red-500"><Trash2 className="w-5 h-5" /></button></div>))}</div><Button variant="ghost" size="sm" onClick={() => addAnswer(q.id)} className="w-full py-6 border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 font-black uppercase tracking-widest text-xs">+ Add Answer</Button></div>
              </div>
            ))}
            <Button variant="secondary" onClick={addQuestion} className="w-full py-20 bg-slate-900/10 rounded-[4rem] flex flex-col items-center"><Plus className="w-14 h-14 text-blue-500 mb-6" /><span className="text-2xl font-black uppercase tracking-[0.25em] text-slate-600">New Round</span></Button>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-10">
          <div className="lg:sticky lg:top-48 space-y-8">
            <section className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] space-y-8 shadow-3xl">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-6"><div className="flex items-center gap-3"><Shield className="w-7 h-7 text-blue-500" /><h2 className="text-md font-black uppercase text-white tracking-widest">{t.competitors}</h2></div><button onClick={addTeam} disabled={teams.length >= 8} className="bg-blue-600/10 text-blue-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">+ Team</button></div>
              <div className="space-y-5 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                {teams.map((team) => (
                  <div key={team.id} className="flex gap-4 items-center bg-slate-950/50 p-4 rounded-[2rem] border-2 border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="relative flex-shrink-0"><div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-xl border-4 border-white/5 overflow-hidden" style={{ backgroundColor: team.color }}><input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" value={team.color} onChange={(e) => updateTeam(team.id, { color: e.target.value })} /></div></div>
                    <div className="flex-1 min-w-0"><input type="text" className="w-full bg-transparent border-none focus:ring-0 font-black text-white text-lg truncate p-0 uppercase" value={team.name} onChange={(e) => updateTeam(team.id, { name: e.target.value })} /></div>
                    <button onClick={() => removeTeam(team.id)} disabled={teams.length <= 2} className="p-3 text-slate-800 hover:text-red-500 transition-all rounded-xl"><Trash2 className="w-6 h-6" /></button>
                  </div>
                ))}
              </div>
            </section>
            <section className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] space-y-8 shadow-3xl">
              <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-6"><AlertCircle className="w-7 h-7 text-red-500" /><h2 className="text-md font-black uppercase text-white tracking-widest">{t.roundRules}</h2></div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">3rd Strike Penalty</label>
                <div className="flex items-center bg-slate-950 p-4 rounded-[1.5rem] border-2 border-slate-800"><input type="number" className="w-20 bg-transparent border-none focus:ring-0 text-3xl font-black text-red-500 text-center" value={strikePenalty} onChange={(e) => setStrikePenalty(parseInt(e.target.value) || 0)} /><div className="flex-1 text-slate-600 text-[10px] font-bold uppercase text-right">Pts Deducted</div></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- GAME ENGINE ---
const GameEngine: React.FC<{ game: Game, onExit: () => void, lang: Language }> = ({ game, onExit, lang }) => {
  const t = translations[lang];
  const [activeGame, setActiveGame] = useState<ActiveGame>(() => ({ game, currentQuestionIndex: 0, teamScores: game?.teams?.reduce((acc, team) => { acc[team.id] = 0; return acc; }, {} as Record<string, number>) || {}, teamStrikes: game?.teams?.reduce((acc, team) => { acc[team.id] = 0; return acc; }, {} as Record<string, number>) || {}, roundPoints: 0, strikes: 0, activeTeamId: null, roomCode: Math.floor(100000 + Math.random() * 900000).toString(), players: [], buzzedPlayerId: null }));
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [showStrikes, setShowStrikes] = useState(0);
  const serviceRef = useRef<MultiplayerService | null>(null);
  const stateRef = useRef({ activeGame, gameState });
  useEffect(() => { stateRef.current = { activeGame, gameState }; }, [activeGame, gameState]);
  const broadcastState = useCallback((uAG: ActiveGame, cGS: GameState) => {
    if (!serviceRef.current || !uAG.game) return;
    const q = uAG.game.questions[uAG.currentQuestionIndex]; if (!q) return;
    const sS: SyncedGameState = { prompt: q.prompt, answers: q.answers.map((a, i) => ({ index: i, revealed: a.revealed, text: a.revealed ? a.text : undefined, points: a.revealed ? a.points : undefined, })), teamScores: uAG.teamScores, teamStrikes: uAG.teamStrikes, teams: uAG.game.teams, players: uAG.players.map(p => ({ id: p.id, emoji: p.emoji, accessory: p.accessory })), roundPoints: uAG.roundPoints, strikes: uAG.strikes, currentQuestionIndex: uAG.currentQuestionIndex, totalQuestions: uAG.game.questions.length, gameState: cGS, buzzedPlayerId: uAG.buzzedPlayerId, strikePenalty: uAG.game.strikePenalty || 0 };
    serviceRef.current.send({ type: 'GAME_UPDATE', payload: sS });
  }, []);
  useEffect(() => {
    const s = new MultiplayerService(activeGame.roomCode, (msg: MultiplayerMessage) => {
      const { activeGame: cA, gameState: cG } = stateRef.current;
      if (msg.type === 'REQUEST_SYNC') broadcastState(cA, cG);
      if (msg.type === 'JOIN') setActiveGame(prev => prev.players.find(p => p.id === msg.payload.id) ? prev : { ...prev, players: [...prev.players, { ...msg.payload, pointsContributed: 0 }] });
      if (msg.type === 'UPDATE_PROFILE') setActiveGame(prev => ({ ...prev, players: prev.players.map(p => p.id === msg.payload.id ? { ...p, emoji: msg.payload.emoji, accessory: msg.payload.accessory } : p) }));
      if (msg.type === 'BUZZ') setActiveGame(prev => { if (prev.buzzedPlayerId) return prev; const p = prev.players.find(p => p.id === msg.payload.playerId); return { ...prev, buzzedPlayerId: msg.payload.playerId, activeTeamId: p ? p.teamId : prev.activeTeamId }; });
    });
    serviceRef.current = s;
    const hb = setInterval(() => { const { activeGame: cA, gameState: cG } = stateRef.current; broadcastState(cA, cG); }, 4000);
    broadcastState(activeGame, gameState);
    return () => { clearInterval(hb); s.close(); serviceRef.current = null; };
  }, [activeGame.roomCode, broadcastState]);
  useEffect(() => { broadcastState(activeGame, gameState); }, [activeGame, gameState, broadcastState]);
  const handleReveal = (aId: string) => { setActiveGame(prev => { const qIdx = prev.currentQuestionIndex; const qs = [...prev.game.questions]; const q = { ...qs[qIdx] }; const ans = [...q.answers]; const aIdx = ans.findIndex(a => a.id === aId); if (aIdx === -1 || ans[aIdx].revealed) return prev; const p = ans[aIdx].points; ans[aIdx] = { ...ans[aIdx], revealed: true }; q.answers = ans; qs[qIdx] = q; const sc = { ...prev.teamScores }; if (prev.activeTeamId) sc[prev.activeTeamId] = (sc[prev.activeTeamId] || 0) + p; return { ...prev, game: { ...prev.game, questions: qs }, roundPoints: prev.roundPoints + p, teamScores: sc }; }); };
  const handleStrike = () => { setActiveGame(prev => { const tS = { ...prev.teamStrikes }; const tSc = { ...prev.teamScores }; let nS = 1; if (prev.activeTeamId) { let c = (tS[prev.activeTeamId] || 0) + 1; nS = c; if (c === 3) { tSc[prev.activeTeamId] = Math.max(0, (tSc[prev.activeTeamId] || 0) - (prev.game.strikePenalty || 0)); c = 0; } tS[prev.activeTeamId] = c; } setShowStrikes(nS); serviceRef.current?.send({ type: 'STRIKE_ANIMATION', payload: { count: nS } }); setTimeout(() => setShowStrikes(0), 1200); serviceRef.current?.send({ type: 'RESET_BUZZER' }); return { ...prev, strikes: nS, teamStrikes: tS, teamScores: tSc, buzzedPlayerId: null, activeTeamId: null }; }); };
  const awardPoints = (tId: string) => { setActiveGame(prev => { const rS = { ...prev.teamStrikes }; Object.keys(rS).forEach(k => rS[k] = 0); return { ...prev, teamScores: { ...prev.teamScores, [tId]: (prev.teamScores[tId] || 0) + prev.roundPoints }, teamStrikes: rS, roundPoints: 0, strikes: 0, activeTeamId: null, buzzedPlayerId: null }; }); serviceRef.current?.send({ type: 'RESET_BUZZER' }); };
  const nextQuestion = () => { if (activeGame.currentQuestionIndex < activeGame.game.questions.length - 1) { setActiveGame(prev => { const rS = { ...prev.teamStrikes }; Object.keys(rS).forEach(k => rS[k] = 0); return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1, roundPoints: 0, strikes: 0, teamStrikes: rS, activeTeamId: null, buzzedPlayerId: null }; }); serviceRef.current?.send({ type: 'RESET_BUZZER' }); } else setGameState('SUMMARY'); };

  if (gameState === 'LOBBY') return (<div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12 bg-slate-950"><div className="text-center space-y-4"><p className="text-blue-400 font-black uppercase tracking-[0.4em] text-sm italic">Room Code</p><div className="bg-white text-slate-950 p-10 rounded-[3.5rem] shadow-2xl scale-110"><h1 className="text-[10rem] font-black game-font tracking-tight">{activeGame.roomCode}</h1></div><h2 className="text-6xl font-black game-font text-white pt-10 uppercase italic tracking-tight">{activeGame.game.title}</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">{activeGame.game.teams.map(team => (<div key={team.id} className="bg-slate-900 border-2 border-slate-800 p-10 rounded-[3rem] flex flex-col items-center space-y-6" style={{ borderBottomColor: team.color, borderBottomWidth: '12px' }}><div className="flex items-center gap-4"><Shield className="w-10 h-10" style={{ color: team.color }} /><h3 className="text-4xl font-black uppercase tracking-tight italic text-white">{team.name}</h3></div><div className="flex flex-wrap gap-4 justify-center min-h-[120px]">{activeGame.players.filter(p => p.teamId === team.id).map(p => (<div key={p.id} className="bg-slate-950 p-5 rounded-[2.5rem] border-2 border-slate-800 flex flex-col items-center gap-2"><span className="text-6xl relative animate-float">{p.emoji}</span><span className="font-black text-xs uppercase tracking-widest text-slate-400">{p.name}</span></div>))}</div></div>))}</div><div className="flex flex-col items-center gap-6"><Button size="lg" className="px-32 py-12 text-5xl shadow-[0_16px_0_rgba(29,78,216,1)] rounded-[3rem] game-font uppercase italic tracking-widest" onClick={() => setGameState('PLAYING')}>{t.startBroadcast}</Button><Button variant="ghost" onClick={onExit} className="text-slate-600 uppercase tracking-widest font-black text-xs hover:text-red-500">{t.cancelSession}</Button></div></div>);
  if (gameState === 'SUMMARY') { 
    const sorted = [...activeGame.game.teams].sort((a, b) => (activeGame.teamScores[b.id] || 0) - (activeGame.teamScores[a.id] || 0)); 
    return (
      <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in duration-1000 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
           {[...Array(30)].map((_, i) => <Star key={i} className="absolute text-yellow-300 fill-current animate-float" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, width: `${Math.random()*20+10}px`, animationDelay: `${Math.random()*5}s` }} />)}
        </div>
        <div className="relative"><Trophy className="w-48 h-48 text-yellow-400 animate-bounce drop-shadow-[0_0_50px_rgba(250,204,21,0.5)]" /><h1 className="text-[12rem] font-black game-font text-white uppercase italic tracking-tighter drop-shadow-2xl text-center leading-none">VICTORY!</h1></div>
        <div className="bg-slate-950/80 backdrop-blur-xl p-10 rounded-[4rem] border-4 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-lg space-y-6">
          {sorted.map((team, i) => (<div key={team.id} className="flex items-center justify-between p-6 rounded-[2.5rem] bg-slate-900 border-2 border-white/5"><div className="flex items-center gap-5"><span className="text-3xl font-black game-font text-slate-600">{i + 1}</span><div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: team.color }}></div><span className="font-black text-2xl uppercase italic tracking-tight text-white">{team.name}</span></div><span className="text-5xl font-black game-font text-yellow-400">{activeGame.teamScores[team.id] || 0}</span></div>))}
        </div>
        <Button size="lg" onClick={onExit} className="px-24 py-10 rounded-[3rem] bg-blue-600 border-b-[12px] border-blue-900 text-4xl uppercase game-font italic tracking-widest hover:translate-y-2 hover:border-b-[6px] active:translate-y-6 active:border-b-0 transition-all">{t.backToMenu}</Button>
      </div>
    ); 
  }
  const buzzed = activeGame.players.find(p => p.id === activeGame.buzzedPlayerId); const currentQ = activeGame.game.questions[activeGame.currentQuestionIndex];
  return (
    <div className="min-h-screen flex flex-col p-4 bg-slate-950">
      <StrikeDisplay strikes={showStrikes} />
      <div className="flex justify-center items-center gap-6 mb-10 pt-4">
        {activeGame.game.teams.map(team => (<div key={team.id} className={`border-4 p-6 rounded-[2.5rem] min-w-[180px] text-center transition-all ${activeGame.activeTeamId === team.id ? 'scale-110 ring-8 ring-white shadow-[0_0_60px_rgba(255,255,255,0.2)] z-10' : 'opacity-60 scale-95'}`} style={{ backgroundColor: team.color, borderColor: team.color }}><div className="flex justify-center gap-2 mb-2 h-8">{[...Array(activeGame.teamStrikes[team.id] || 0)].map((_, i) => <XCircle key={i} className="w-8 h-8 text-red-100 animate-in zoom-in" />)}</div><p className="text-xs font-black uppercase text-white/90 tracking-widest italic">{team.name}</p><p className="text-5xl font-black game-font text-white drop-shadow-lg">{activeGame.teamScores[team.id] || 0}</p></div>))}
        <div className="bg-slate-800 border-4 border-slate-700 p-8 px-16 rounded-[3.5rem] shadow-inner flex flex-col items-center"><span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Round Points</span><span className="text-7xl font-black game-font text-yellow-400 drop-shadow-xl">{activeGame.roundPoints}</span></div>
      </div>
      <div className="bg-blue-900/40 p-12 rounded-[4rem] border-4 border-blue-500/30 text-center mb-10 shadow-2xl backdrop-blur-md relative max-w-5xl mx-auto w-full"><h2 className="text-5xl font-black text-white uppercase italic tracking-tight leading-tight">"{currentQ?.prompt}"</h2>{buzzed && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-white p-10 rounded-[3rem] font-black animate-pulse z-20 border-8 border-white shadow-[0_0_80px_rgba(234,179,8,0.5)] flex items-center gap-6"><span className="text-8xl animate-buzzed-jump">{buzzed.emoji}</span><div className="text-left"><p className="text-xs uppercase tracking-[0.4em] text-yellow-900 font-black">PLAYER BUZZED!</p><p className="text-6xl game-font italic">{buzzed.name}</p></div></div>}</div>
      <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min mb-48">{[...Array(8)].map((_, i) => <AnswerTile key={i} index={i} answer={currentQ?.answers[i]} onClick={currentQ?.answers[i] ? () => handleReveal(currentQ.answers[i].id) : undefined} hostMode={true} />)}</div>
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border-t-8 border-blue-600 p-8 flex flex-col items-center gap-4 z-40 shadow-2xl"><div className="flex flex-wrap items-center justify-between w-full max-w-7xl gap-8"><Button variant="danger" size="lg" onClick={handleStrike} className="px-14 py-8 rounded-[2.5rem] border-b-[12px] border-red-900 game-font text-3xl uppercase italic tracking-widest shadow-2xl"><XCircle className="w-10 h-10 mr-4" /> {t.strike}</Button><div className="flex flex-wrap gap-3 justify-center flex-1 max-w-2xl">{currentQ?.answers.map((a, i) => (<Button key={a.id} variant={a.revealed ? "ghost" : "primary"} size="sm" className={`text-sm px-6 h-16 rounded-2xl transition-all border-b-4 border-black/20 ${a.revealed ? 'opacity-20' : 'shadow-xl'}`} onClick={() => handleReveal(a.id)} disabled={a.revealed}><span className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mr-3 font-black">{i + 1}</span><span className="font-bold">{a.text}</span></Button>))}</div><div className="flex flex-col gap-4 min-w-[280px]"><div className="grid grid-cols-2 gap-3">{activeGame.game.teams.map(team => <button key={team.id} onClick={() => awardPoints(team.id)} className="px-6 py-4 rounded-2xl text-xs font-black uppercase text-white border-b-8 border-black/30 active:border-b-0 active:translate-y-2 transition-all shadow-xl italic" style={{ backgroundColor: team.color }}>Win {team.name}</button>)}</div><Button size="lg" onClick={nextQuestion} className="w-full py-8 rounded-[2.5rem] border-b-[12px] border-blue-900 game-font uppercase italic tracking-widest text-2xl shadow-2xl">{t.nextQuestion} <ChevronRight className="w-8 h-8 ml-2" /></Button></div></div></div>
    </div>
  );
};

// --- PLAYER INTERFACE ---
const HUMAN_LIKE = ['👶', '👧', '👦', '👩', '👨', '👵', '👴', '👮', '🕵️', '💂', '👷', '🤴', '👸', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🤵', '👰', '🥷', '🧑‍🚀', '🧑‍🚒', '🧑‍🔬', '🧑‍🎨', '🧑‍💻', '🧑‍🎤', '🧑‍🌾'];
const ANIMALS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦆', '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🐙', '🦖', '🐉', '🐳', '🦙', '🦥'];
const ACCESSORIES = ['', '🎩', '👑', '🎓', '🎀', '🤠', '🎭', '🕶️', '🚀', '🔥', '✨', '🍕', '🎸', '⚽', '💎', '🎮', '💡', '🎧', '🎈', '🍿', '🥤', '🥨', '🍪', '🎨'];
const PlayerInterface: React.FC<{ roomCode: string, playerName: string, playerEmoji: string, playerId: string, playerTeamId: string, onExit: () => void, lang: Language, setLang: (l: Language) => void }> = ({ roomCode, playerName, playerEmoji, playerId, playerTeamId, onExit, lang, setLang }) => {
  const t = translations[lang];
  const [status, setStatus] = useState<'WAITING' | 'READY' | 'BUZZED'>('WAITING');
  const [syncState, setSyncState] = useState<SyncedGameState | null>(null);
  const [showStrikes, setShowStrikes] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState(playerEmoji);
  const [currentAccessory, setCurrentAccessory] = useState('');
  const serviceRef = useRef<MultiplayerService | null>(null);
  const handlersRef = useRef({ status, playerId });
  useEffect(() => { handlersRef.current = { status, playerId }; }, [status, playerId]);
  useEffect(() => {
    const s = new MultiplayerService(roomCode, (msg: MultiplayerMessage) => {
      if (msg.type === 'RESET_BUZZER') setStatus('READY');
      if (msg.type === 'STRIKE_ANIMATION') { setShowStrikes(msg.payload.count); setTimeout(() => setShowStrikes(0), 1200); }
      if (msg.type === 'GAME_UPDATE') { setSyncState(msg.payload); const { status: curS, playerId: myI } = handlersRef.current; if (msg.payload.gameState === 'PLAYING' && curS === 'WAITING') setStatus('READY'); if (msg.payload.buzzedPlayerId && msg.payload.buzzedPlayerId !== myI) setStatus('WAITING'); }
    });
    serviceRef.current = s;
    s.send({ type: 'JOIN', payload: { name: playerName, id: playerId, emoji: currentEmoji, teamId: playerTeamId, accessory: currentAccessory } });
    return () => { s.close(); serviceRef.current = null; };
  }, [roomCode, playerId, playerName, playerTeamId]);
  const handleBuzz = () => { if (status !== 'READY') return; setStatus('BUZZED'); serviceRef.current?.send({ type: 'BUZZ', payload: { playerId } }); if ('vibrate' in navigator) navigator.vibrate(200); };
  const updateProfile = (emoji: string, accessory: string) => { setCurrentEmoji(emoji); setCurrentAccessory(accessory); serviceRef.current?.send({ type: 'UPDATE_PROFILE', payload: { id: playerId, emoji, accessory } }); };
  const myTeam = syncState?.teams.find(t_cfg => t_cfg.id === playerTeamId);
  if (!syncState || syncState.gameState === 'LOBBY') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-10 border-t-[20px]" style={{ borderTopColor: myTeam?.color || '#3b82f6' }}>
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3"><LanguagePicker current={lang} onChange={setLang} /><button onClick={onExit} className="p-3 bg-slate-800 rounded-2xl hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all"><LogOut className="w-6 h-6" /></button></div>
        <div className="flex flex-col items-center space-y-8 max-w-sm w-full"><div className="w-64 h-64 md:w-80 md:h-80 rounded-[4rem] bg-slate-900 border-4 border-slate-800 flex items-center justify-center relative shadow-3xl hover:scale-105 transition-all group" onClick={() => setIsEditingProfile(true)}><span className="text-[12rem] relative animate-float drop-shadow-2xl select-none">{currentEmoji}</span><span className="absolute -top-6 -right-8 text-8xl rotate-12 drop-shadow-xl z-20 group-hover:rotate-0 transition-transform">{currentAccessory}</span><div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-30"><div className="bg-blue-600 text-white text-xs font-black uppercase tracking-[0.3em] px-10 py-4 rounded-[2rem] shadow-2xl border-4 border-slate-950 flex items-center gap-2"><Sparkles className="w-5 h-5" /> {t.customize}</div></div></div><div className="space-y-4 pt-8"><h2 className="text-7xl font-black game-font uppercase italic tracking-tighter" style={{ color: myTeam?.color || '#3b82f6' }}>{myTeam?.name || 'Waiting...'}</h2><div className="flex flex-col items-center gap-3"><div className="flex items-center gap-3"><div className="w-3 h-3 bg-blue-600 rounded-full animate-ping"></div><p className="text-slate-500 text-sm font-black uppercase tracking-[0.4em]">{t.waitingForHost}</p></div><p className="bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-[10px] font-black text-slate-600 uppercase tracking-widest">Room: {roomCode}</p></div></div></div>
        {isEditingProfile && (
          <div className="fixed inset-0 bg-slate-950/98 z-[200] p-6 flex items-center justify-center backdrop-blur-3xl animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-2xl rounded-[4rem] p-12 border-4 border-slate-800 shadow-3xl space-y-12 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center"><div className="flex items-center gap-4"><Palette className="w-10 h-10 text-blue-500" /><h3 className="text-5xl font-black game-font uppercase text-white italic tracking-widest">{t.customize}</h3></div><button onClick={() => setIsEditingProfile(false)} className="text-slate-500 bg-slate-800 p-4 rounded-3xl active:scale-90 transition-all"><LucideX className="w-10 h-10" /></button></div>
              <div className="bg-slate-950 rounded-[4rem] p-10 flex flex-col items-center justify-center relative border-4 border-slate-800/50 shadow-inner flex-shrink-0">
                <span className="text-[14rem] animate-float drop-shadow-2xl select-none">{currentEmoji}</span>
                <span className="absolute top-10 right-20 text-[100px] rotate-12 drop-shadow-xl">{currentAccessory}</span>
                <button onClick={() => { const all = [...HUMAN_LIKE, ...ANIMALS]; updateProfile(all[Math.floor(Math.random()*all.length)], ACCESSORIES[Math.floor(Math.random()*ACCESSORIES.length)]); }} className="absolute bottom-6 right-6 p-6 bg-blue-600 rounded-[2.5rem] shadow-2xl active:rotate-180 transition-all active:scale-90 border-4 border-slate-950"><RefreshCcw className="w-10 h-10 text-white" /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-10 py-2">
                <div className="space-y-6">
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em] ml-2">Choose Avatar</p>
                   <div className="grid grid-cols-5 gap-4">{[...HUMAN_LIKE, ...ANIMALS].map(a => (<button key={a} onClick={() => updateProfile(a, currentAccessory)} className={`text-5xl p-6 rounded-[2rem] transition-all ${currentEmoji === a ? 'bg-blue-600 ring-8 ring-white scale-110 shadow-2xl' : 'bg-slate-800 hover:bg-slate-700 active:scale-90'}`}>{a}</button>))}</div>
                </div>
                <div className="space-y-6">
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em] ml-2">Accessories</p>
                   <div className="grid grid-cols-5 gap-4 pb-10">{ACCESSORIES.map(acc => (<button key={acc || 'none'} onClick={() => updateProfile(currentEmoji, acc)} className={`text-5xl h-28 flex items-center justify-center rounded-[2rem] transition-all ${currentAccessory === acc ? 'bg-blue-600 ring-8 ring-white scale-110 shadow-2xl' : 'bg-slate-800 hover:bg-slate-700 active:scale-90'}`}>{acc || <LucideX className="opacity-20" />}</button>))}</div>
                </div>
              </div>
              <Button onClick={() => setIsEditingProfile(false)} className="w-full py-8 text-3xl game-font tracking-[0.2em] uppercase italic rounded-[3rem] border-b-[12px] border-blue-900 active:border-b-0 active:translate-y-4 transition-all shadow-2xl">{t.readyToWin}</Button>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col p-4 relative overflow-hidden pb-48 border-t-[16px]`} style={{ borderTopColor: myTeam?.color }}>
      <StrikeDisplay strikes={showStrikes} />
      <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
        {syncState.teams.map(team => (<div key={team.id} className={`border-2 px-6 py-4 rounded-3xl text-center min-w-[100px] transition-all relative ${playerTeamId === team.id ? 'opacity-100 scale-110 shadow-2xl ring-4 ring-white z-10' : 'opacity-20 scale-90'}`} style={{ backgroundColor: team.color, borderColor: team.color }}><div className="absolute -top-4 -right-2 flex gap-1">{[...Array(syncState.teamStrikes[team.id] || 0)].map((_, i) => <div key={i} className="bg-red-600 text-white rounded-full p-1 border-2 border-white shadow-xl animate-in zoom-in"><LucideX className="w-3 h-3 stroke-[5]" /></div>)}</div><p className="text-[10px] font-black uppercase text-white/90 truncate tracking-tight">{team.name}</p><p className="text-4xl font-black game-font text-white drop-shadow-lg">{syncState.teamScores[team.id] || 0}</p></div>))}
        <div className="bg-slate-800 border-2 border-slate-700 px-10 py-4 rounded-full shadow-2xl"><span className="text-4xl font-black game-font text-yellow-400 drop-shadow-md">{syncState.roundPoints}</span></div>
      </div>
      <div className="bg-blue-900/30 backdrop-blur-md p-10 rounded-[3rem] border-2 border-blue-500/30 text-center mb-10 shadow-2xl animate-in fade-in duration-700"><h2 className="text-3xl font-black text-white uppercase italic tracking-tight leading-snug">"{syncState.prompt}"</h2></div>
      <div className="flex-1 max-w-lg mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">{[...Array(8)].map((_, i) => { const sA = syncState.answers.find(a => a.index === i); return <AnswerTile key={i} index={i} answer={sA ? { id: i.toString(), text: sA.text || "", points: sA.points || 0, revealed: sA.revealed } : undefined} />; })}</div>
      <div className="fixed bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-slate-950 via-slate-950/90 flex flex-col items-center space-y-10 z-50">
        {syncState.buzzedPlayerId && syncState.buzzedPlayerId !== playerId && <div className="bg-red-600 text-white px-10 py-3 rounded-full text-xs font-black uppercase border-4 border-white/20 shadow-2xl animate-pulse tracking-[0.4em]">{t.locked}</div>}
        <div className="relative">
          {status === 'READY' && <div className="absolute inset-0 rounded-full animate-buzzer-ready scale-[1.4]"></div>}
          <button onClick={handleBuzz} disabled={status !== 'READY'} className={`w-52 h-52 rounded-full border-8 transition-all duration-75 flex flex-col items-center justify-center shadow-[0_40px_80px_rgba(0,0,0,0.8)] active:scale-90 relative z-10 border-white/40 scale-110`} style={{ backgroundColor: status === 'READY' ? (myTeam?.color || '#dc2626') : status === 'BUZZED' ? '#eab308' : '#1e293b' }}>
            <span className={`absolute -top-12 -right-6 text-9xl rotate-12 drop-shadow-2xl z-20 ${status === 'BUZZED' ? 'animate-buzzed-jump' : 'animate-float'}`}>{currentAccessory}</span>
            <div className={`${status === 'BUZZED' ? 'animate-buzzed-jump' : ''} flex flex-col items-center`}>
              <Zap className={`w-16 h-16 mb-2 ${status === 'READY' ? 'text-white animate-pulse' : 'text-slate-400 opacity-50'}`} />
              <span className="text-4xl font-black game-font text-white uppercase italic tracking-widest drop-shadow-2xl">{status === 'READY' ? t.buzz : t.wait}</span>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-xs font-black uppercase tracking-[0.5em] bg-slate-900/80 backdrop-blur-2xl px-12 py-5 rounded-[2.5rem] border-2 border-slate-800 shadow-3xl"><div className="flex items-center gap-3"><Shield className={`w-6 h-6`} style={{ color: myTeam?.color }} fill="currentColor" /><span className="text-white">{playerName}</span></div><span className="w-2 h-2 bg-slate-700 rounded-full" /><span className="text-slate-500 italic">Code: {roomCode}</span></div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [view, setView] = useState<'HOME' | 'CREATE' | 'PLAY' | 'JOIN' | 'PLAYER_GAME' | 'AUTH'>('HOME');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [playerInfo, setPlayerInfo] = useState({ code: '', name: '', teamId: '', emoji: '🐱', id: '' });
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  useEffect(() => {
    const sU = localStorage.getItem('feud_current_user'); if (sU) setCurrentUser(JSON.parse(sU));
    const sG = localStorage.getItem('feud_games'); if (sG) setAllGames(JSON.parse(sG));
    const sP = localStorage.getItem('feud_player_id'); if (!sP) { const nP = Math.random().toString(36).substr(2, 9); localStorage.setItem('feud_player_id', nP); setPlayerInfo(p => ({ ...p, id: nP })); } else setPlayerInfo(p => ({ ...p, id: sP }));
  }, []);

  const handleCreateGame = (g: Game) => { const updated = [...allGames, g]; setAllGames(updated); localStorage.setItem('feud_games', JSON.stringify(updated)); setView('HOME'); };
  const handleDeleteGame = (id: string, e: React.MouseEvent) => { e.stopPropagation(); const updated = allGames.filter(g => g.id !== id); setAllGames(updated); localStorage.setItem('feud_games', JSON.stringify(updated)); };
  const handleJoin = (code: string, name: string, teamId: string) => { setPlayerInfo(p => ({ ...p, code, name, teamId })); setView('PLAYER_GAME'); };

  if (view === 'CREATE') return <GameCreator onSave={handleCreateGame} onCancel={() => setView('HOME')} lang={lang} />;
  if (view === 'AUTH') return <AuthView onAuthSuccess={(u) => { setCurrentUser(u); localStorage.setItem('feud_current_user', JSON.stringify(u)); setView('HOME'); }} onCancel={() => setView('HOME')} lang={lang} />;
  if (view === 'JOIN') return <JoinView onJoin={handleJoin} onCancel={() => setView('HOME')} lang={lang} />;
  if (view === 'PLAYER_GAME') return <PlayerInterface {...playerInfo} playerEmoji={playerInfo.emoji} playerId={playerInfo.id} playerTeamId={playerInfo.teamId} roomCode={playerInfo.code} onExit={() => setView('HOME')} lang={lang} setLang={setLang} />;
  if (view === 'PLAY' && selectedGame) return <GameEngine game={selectedGame} onExit={() => setView('HOME')} lang={lang} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('HOME')}><div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 transition-transform"><Layout className="w-8 h-8 text-white" /></div><span className="text-2xl font-black game-font tracking-tighter text-white uppercase italic">{t.appName}</span></div>
          <div className="flex items-center gap-5"><LanguagePicker current={lang} onChange={setLang} />{currentUser ? (<div className="flex items-center gap-4"><div className="flex flex-col items-end"><span className="text-xs font-black text-white uppercase tracking-[0.2em] italic">{currentUser.name}</span><button onClick={() => { setCurrentUser(null); localStorage.removeItem('feud_current_user'); }} className="text-[10px] text-slate-500 hover:text-red-500 transition-colors uppercase font-black tracking-widest">{t.logout}</button></div><div className="w-12 h-12 bg-slate-800 border-2 border-slate-700 rounded-2xl flex items-center justify-center shadow-xl"><UserIcon className="w-6 h-6 text-blue-500" /></div></div>) : (<Button size="sm" onClick={() => setView('AUTH')} className="bg-slate-800 hover:bg-slate-700"><LogIn className="w-4 h-4 mr-2" /> {t.login}</Button>)}</div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-12 space-y-24">
        <div className="flex flex-col items-center text-center space-y-12 py-24 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"><div className="w-[800px] h-[800px] bg-blue-600 rounded-full blur-[160px] animate-pulse"></div></div>
          <div className="relative z-10 animate-in zoom-in duration-1000"><h1 className="text-8xl md:text-[14rem] font-black game-font text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] uppercase italic tracking-tighter leading-none">{t.branding}</h1><p className="text-2xl md:text-4xl text-blue-400 font-black game-font uppercase tracking-[0.2em] mt-4 drop-shadow-lg opacity-80">{lang === 'ru' ? 'Ведущий Шоу №1' : 'The Ultimate Host Experience'}</p></div>
          <div className="flex flex-wrap items-center justify-center gap-10 relative z-10">
            <Button size="lg" onClick={() => setView('JOIN')} className="px-16 py-10 text-4xl game-font tracking-[0.1em] rounded-[3rem] border-b-[12px] border-blue-900 shadow-2xl hover:translate-y-2 hover:border-b-[6px] active:translate-y-6 active:border-b-0 transition-all italic">{t.joinAsPlayer}</Button>
            <Button size="lg" variant="secondary" onClick={() => { if (!currentUser) setView('AUTH'); else setView('CREATE'); }} className="px-16 py-10 text-4xl game-font tracking-[0.1em] rounded-[3rem] border-b-[12px] border-slate-900 shadow-2xl hover:translate-y-2 hover:border-b-[6px] active:translate-y-6 active:border-b-0 transition-all italic">{t.createBoard}</Button>
          </div>
        </div>
        <div className="space-y-12 relative z-10">
          <div className="flex items-center gap-6"><div className="w-2 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)]"></div><h2 className="text-5xl font-black game-font text-white uppercase italic tracking-widest">{currentUser ? t.yourBoards : t.publicSamples}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {allGames.length === 0 ? (
              <div className="col-span-full py-32 bg-slate-900/30 border-4 border-dashed border-slate-800 rounded-[4rem] flex flex-col items-center justify-center text-slate-700 space-y-6">
                <Plus className="w-24 h-24 opacity-10" />
                <p className="font-black uppercase tracking-[0.4em] text-xl italic opacity-30">Your boards will appear here</p>
              </div>
            ) : (
              allGames.map(game => (
                <div key={game.id} onClick={() => { setSelectedGame(game); setView('PLAY'); }} className="group relative bg-slate-900 border-2 border-slate-800 p-10 rounded-[3.5rem] cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/80 transition-all hover:scale-[1.03] shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-colors"></div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase text-blue-500 tracking-[0.3em] bg-blue-600/10 px-4 py-1.5 rounded-full border border-blue-500/20">{game.questions.length} Rounds</span><button onClick={(e) => handleDeleteGame(game.id, e)} className="p-3 text-slate-700 hover:text-red-500 transition-all rounded-2xl hover:bg-red-500/10"><Trash2 className="w-6 h-6" /></button></div>
                    <h3 className="text-4xl font-black text-white game-font uppercase italic leading-tight line-clamp-2 drop-shadow-md">{game.title}</h3>
                    <div className="pt-6 flex items-center justify-between">
                      <div className="flex -space-x-3">{game.teams.slice(0, 4).map(t => <div key={t.id} className="w-10 h-10 rounded-2xl border-4 border-slate-900 shadow-xl" style={{ backgroundColor: t.color }}></div>)}</div>
                      <div className="bg-slate-950 p-4 rounded-3xl group-hover:bg-blue-600 transition-all shadow-xl group-hover:scale-110 group-hover:rotate-6"><Play className="w-8 h-8 text-white fill-current" /></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 p-16 text-center"><p className="text-slate-600 text-sm font-black uppercase tracking-[0.6em] italic opacity-40">&copy; 2024 FEUD HOST &bull; THE ULTIMATE EXPERIENCE</p></footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
