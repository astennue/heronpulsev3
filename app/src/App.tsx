import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, CheckSquare, BookOpen, FolderKanban, MessageCircle, Trophy,
  BarChart3, Settings, Sun, Moon, Menu, X, LogOut, Play, Pause, RotateCcw,
  Volume2, VolumeX, ChevronRight, Star, Target, Clock, AlertTriangle, TrendingUp,
  CheckCircle2, Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Calculator, CalendarDays, ListTodo,
  Radar, Users, Github, Twitter, Instagram, Linkedin, Send, MoreVertical, Plus,
  Video, Phone, Paperclip, Smile, Award, Crown, Medal, Flame,
  ChevronLeft, Download, Filter, Search, Tag, UserPlus, Archive, Trash2, Edit2,
  Check, ChevronDown, Bell, Moon as MoonIcon, Sun as SunIcon, Grid, List,
} from 'lucide-react';
import { useStore } from './store';
import type { Task } from './store';
import { format, addDays, startOfWeek, addWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';

// ==================== NOTIFICATIONS - FIXED AUTO-DISMISS ====================
const Toast = ({ notification, onClose }: { notification: { id: string; title: string; message: string; type: string }; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons: Record<string, React.ReactNode> = { 
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />, 
    error: <AlertTriangle className="w-5 h-5 text-red-500" />, 
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />, 
    info: <Target className="w-5 h-5 text-blue-500" /> 
  };
  const borders: Record<string, string> = { success: 'border-l-green-500', error: 'border-l-red-500', warning: 'border-l-yellow-500', info: 'border-l-blue-500' };
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 100, scale: 0.9 }} 
      animate={{ opacity: 1, x: 0, scale: 1 }} 
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 ${borders[notification.type]} p-4 min-w-[320px] max-w-md`}>
      <div className="flex items-start gap-3">
        {icons[notification.type]}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{notification.title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notification.message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const NotificationContainer = () => {
  const { notifications, markNotificationAsRead, clearNotifications } = useStore();
  
  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <Toast key={n.id} notification={n} onClose={() => markNotificationAsRead(n.id)} />
        ))}
      </AnimatePresence>
      {notifications.length > 1 && (
        <button onClick={clearNotifications} className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors ml-auto block">
          Clear all ({notifications.length})
        </button>
      )}
    </div>
  );
};

// ==================== UI COMPONENTS ====================
const Card = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${onClick ? 'cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

const BadgeUI = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>;
};

// ==================== POMODORO TIMER - NO DRAG ====================
const PomodoroTimer = ({ compact = false }: { compact?: boolean }) => {
  const { pomodoroTime, pomodoroActive, pomodoroMode, completedSessions, setPomodoroTime, setPomodoroActive, setPomodoroMode, incrementSessions, addFocusTime, addNotification } = useStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pomodoroActive && pomodoroTime > 0) {
      intervalRef.current = setInterval(() => setPomodoroTime(pomodoroTime - 1), 1000);
    } else if (pomodoroTime === 0) {
      setPomodoroActive(false);
      if (pomodoroMode === 'focus') {
        incrementSessions();
        addFocusTime(25);
        addNotification({ title: 'Focus Complete!', message: 'Great job! Take a break.', type: 'success', read: false });
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pomodoroActive, pomodoroTime, pomodoroMode]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = () => { const total = pomodoroMode === 'focus' ? 25 * 60 : pomodoroMode === 'shortBreak' ? 5 * 60 : 15 * 60; return ((total - pomodoroTime) / total) * 100; };

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Focus Timer</p>
            <p className="text-2xl font-bold text-[#0055A4]">{formatTime(pomodoroTime)}</p>
          </div>
          <button onClick={() => setPomodoroActive(!pomodoroActive)} className="w-10 h-10 rounded-full bg-[#0055A4] text-white flex items-center justify-center hover:bg-[#004080] transition-colors shadow-lg shadow-[#0055A4]/30">
            {pomodoroActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white"><Target className="w-5 h-5 text-[#0055A4]" /> Focus Timer</h3>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">{soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}</button>
      </div>
      <div className="flex justify-center gap-2 mb-6">
        {(['focus', 'shortBreak', 'longBreak'] as const).map((m) => (
          <button key={m} onClick={() => setPomodoroMode(m)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pomodoroMode === m ? 'bg-[#0055A4] text-white shadow-lg shadow-[#0055A4]/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'}`}>
            {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="10" fill="none" className="text-gray-200 dark:text-gray-700" />
          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 88}`} strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress() / 100)}`} className="text-[#0055A4] transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">{formatTime(pomodoroTime)}</span>
          <span className="text-sm text-gray-500 mt-1">{pomodoroMode === 'focus' ? 'Stay focused!' : 'Take a break'}</span>
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={() => setPomodoroActive(!pomodoroActive)} className="w-14 h-14 rounded-full bg-[#0055A4] text-white flex items-center justify-center hover:bg-[#004080] transition-all shadow-lg shadow-[#0055A4]/30 hover:scale-105">
          {pomodoroActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <button onClick={() => { setPomodoroActive(false); setPomodoroMode(pomodoroMode); }} className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-all dark:bg-gray-700 dark:text-gray-400">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Completed <span className="font-semibold text-[#0055A4]">{completedSessions}</span> sessions • <span className="font-semibold">{Math.floor(completedSessions * 25 / 60)}h</span> focused
      </div>
    </Card>
  );
};

// ==================== LOGIN MODAL ====================
const LoginModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle, setCurrentView, addNotification } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const success = await login(email, password);
    if (success) {
      addNotification({ title: 'Welcome back!', message: 'Successfully logged in.', type: 'success', read: false });
      setCurrentView('dashboard');
      onClose();
    } else {
      setError('Invalid email or password. Try the demo account.');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    if (!email.endsWith('@umak.edu.ph')) {
      setError('Please use your @umak.edu.ph email address');
      setIsLoading(false);
      return;
    }
    const success = await loginWithGoogle(email);
    if (success) {
      addNotification({ title: 'Welcome!', message: 'Successfully logged in with Google.', type: 'success', read: false });
      setCurrentView('dashboard');
      onClose();
    } else {
      setError('Failed to login with Google');
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
              <p className="text-sm text-gray-500 mt-1">Sign in to continue to HeronPulse</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />{error}
            </motion.div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@umak.edu.ph"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0055A4] focus:border-transparent transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0055A4] focus:border-transparent transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full px-4 py-3 bg-[#0055A4] text-white rounded-xl hover:bg-[#004080] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg shadow-[#0055A4]/25 hover:shadow-xl hover:shadow-[#0055A4]/30">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-3 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span></div>
            </div>
            <button onClick={handleGoogleLogin} disabled={isLoading} className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-semibold">Demo Account:</span><br />
              Email: reinernuevas.acads@gmail.com<br />
              Password: @CSFDSARein03082026
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== LANDING PAGE SECTIONS ====================
const Navigation = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useStore();
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 50); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  const navLinks = [{ label: 'Features', href: '#features' }, { label: 'Dashboard', href: '#dashboard' }, { label: 'Forecast', href: '#forecast' }, { label: 'Testimonials', href: '#testimonials' }];
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0055A4] rounded-lg flex items-center justify-center"><Target className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">HeronPulse</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => <a key={l.label} href={l.href} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#0055A4] transition-colors">{l.label}</a>)}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
            <button onClick={onLoginClick} className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#0055A4] text-white rounded-lg hover:bg-[#004080] transition-colors font-medium shadow-lg shadow-[#0055A4]/25">
              <LogOut className="w-4 h-4" />Sign In
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((l) => <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">{l.label}</a>)}
              <button onClick={() => { setMobileMenuOpen(false); onLoginClick(); }} className="w-full px-4 py-2 bg-[#0055A4] text-white rounded-lg font-medium">Sign In</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const HeroSection = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const cards = [
    { image: '/dashboard-card.jpg', position: 'left-[5%] top-[15%]', rotate: '-8deg', delay: 0.6 },
    { image: '/calendar-card.jpg', position: 'left-[12%] top-[55%]', rotate: '5deg', delay: 0.75 },
    { image: '/tasks-card.jpg', position: 'left-[25%] top-[75%]', rotate: '-3deg', delay: 0.9 },
    { image: '/workload-card.jpg', position: 'right-[5%] top-[20%]', rotate: '6deg', delay: 0.7 },
    { image: '/focus-card.jpg', position: 'right-[10%] top-[60%]', rotate: '-5deg', delay: 0.85 },
  ];
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-white to-[#E0F2FE] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-16">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#0055A4]/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#3B82F6]/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      {cards.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0, rotate: c.rotate }} transition={{ duration: 0.9, delay: c.delay }}
          className={`absolute ${c.position} hidden lg:block w-64 z-10`} style={{ animation: `float ${5+i}s ease-in-out infinite`, animationDelay: `${i}s` }}>
          <div className="rounded-xl overflow-hidden shadow-2xl hover:scale-105 transition-all"><img src={c.image} alt="" className="w-full h-auto" /></div>
        </motion.div>
      ))}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0055A4]/10 text-[#0055A4] rounded-full text-sm font-medium mb-6"><Sparkles className="w-4 h-4" />Exclusively for UMAK CCIS Students</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Your semester,<br /><span className="text-[#0055A4]">visualized.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          HeronPulse helps students plan smarter, stay on track, and avoid overload—before it happens.
        </motion.p>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 1 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onLoginClick} className="w-full sm:w-auto px-8 py-4 bg-[#0055A4] text-white rounded-xl font-semibold hover:bg-[#004080] transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-[#0055A4]/25">Get started<ArrowRight className="w-5 h-5" /></button>
          <button onClick={onLoginClick} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"><Play className="w-5 h-5" />View demo</button>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.2 }} className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /><span>2,500+ students</span></div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /><span>94% accuracy</span></div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /><span>AI-powered</span></div>
        </motion.div>
      </div>
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }`}</style>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    { icon: Calculator, title: 'Workload that adds up', description: 'See your total academic load at a glance—from assignments and exams to research and deadlines.', size: 'large' },
    { icon: CalendarDays, title: 'Smart calendar', description: 'Sync your academic schedule and let HeronPulse highlight what matters most each day.', size: 'normal' },
    { icon: ListTodo, title: 'Task breakdown', description: 'Split big projects into manageable steps with clear deadlines and progress tracking.', size: 'normal' },
    { icon: Radar, title: 'Risk radar', description: 'Get early warnings before heavy weeks. HeronPulse spots overload before it hits.', size: 'large' },
    { icon: Users, title: 'Team-friendly', description: 'Collaborate on group projects, share progress, and stay aligned with your teammates.', size: 'large' },
  ];
  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-medium text-[#0055A4] uppercase tracking-wider">Features</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Everything you need to stay ahead</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Powerful tools designed specifically for student success</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 hover:border-[#0055A4]/20 hover:shadow-xl transition-all ${f.size === 'large' ? 'md:row-span-2' : ''}`}>
              <div className="w-12 h-12 bg-[#0055A4]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#0055A4] group-hover:scale-110 transition-all">
                <f.icon className="w-6 h-6 text-[#0055A4] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DashboardPreviewSection = () => {
  const features = [{ icon: Clock, title: 'Timeline view', description: 'See your entire semester at a glance' }, { icon: Calendar, title: 'Calendar sync', description: 'Connect with Google, Outlook, Apple' }, { icon: FolderKanban, title: 'Task groups', description: 'Organize by course or project' }, { icon: Target, title: 'Focus mode', description: 'Eliminate distractions' }];
  return (
    <section id="dashboard" className="py-24 bg-slate-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-sm font-medium text-[#0055A4] uppercase tracking-wider">Dashboard</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Your academic command center</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Everything you need, organized in one beautiful interface</p>
            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 bg-[#0055A4]/10 rounded-lg flex items-center justify-center flex-shrink-0"><f.icon className="w-5 h-5 text-[#0055A4]" /></div>
                  <div><h4 className="font-semibold text-gray-900 dark:text-white">{f.title}</h4><p className="text-sm text-gray-600 dark:text-gray-400">{f.description}</p></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow hover:scale-[1.02]"><img src="/dashboard-card.jpg" alt="Dashboard" className="w-full h-auto" /></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ForecastSection = () => (
  <section id="forecast" className="py-24 bg-white dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <span className="text-sm font-medium text-[#0055A4] uppercase tracking-wider">14-Day Forecast</span>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">See what's coming</h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">AI-powered predictions help you prepare for busy periods</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all hover:scale-[1.02]"><img src="/forecast-card.jpg" alt="Forecast" className="w-full h-auto" /></div>
      </motion.div>
    </div>
  </section>
);

const RiskMonitorSection = () => (
  <section className="py-24 bg-slate-50 dark:bg-gray-800/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1">
          <div className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all hover:scale-[1.02]"><img src="/risk-card.jpg" alt="Risk" className="w-full h-auto" /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
          <span className="text-sm font-medium text-[#0055A4] uppercase tracking-wider">Risk Monitor</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Stay ahead of overload</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Early warnings help you adjust before things get overwhelming</p>
          <div className="space-y-4">
            {[{ icon: AlertTriangle, title: 'Overload alerts', description: 'Get notified when your workload exceeds healthy levels' }, { icon: Sparkles, title: 'Recovery tips', description: 'Receive personalized suggestions for managing stress' }, { icon: BarChart3, title: 'Weekly reports', description: 'Track your patterns and improve over time' }].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><item.icon className="w-5 h-5 text-red-500" /></div>
                <div><h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4><p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p></div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const PhotoStatementSection = () => (
  <section className="relative h-[60vh] overflow-hidden">
    <div className="absolute inset-0">
      <img src="/campus-photo.jpg" alt="Students" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
    </div>
    <div className="relative h-full flex items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">Built for students who want to do more—without burning out.</h2>
        <p className="text-lg text-white/80">Join thousands of students already using HeronPulse</p>
      </motion.div>
    </div>
  </section>
);

const TestimonialsSection = () => {
  const testimonials = [
    { name: 'Alexa', year: '2nd Year CS', quote: 'HeronPulse changed how I manage my semester. I actually feel in control now.', avatar: '/avatar-1.jpg' },
    { name: 'Jordan', year: '3rd Year Engineering', quote: 'The forecast feature is a game-changer. I can see busy weeks coming.', avatar: '/avatar-2.jpg' },
    { name: 'Morgan', year: '1st Year Business', quote: 'I used to miss deadlines all the time. Now I never do.', avatar: '/avatar-3.jpg' },
    { name: 'Casey', year: '4th Year Design', quote: 'Finally, a tool that understands student life. Simple and powerful.', avatar: '/avatar-4.jpg' },
    { name: 'Riley', year: '2nd Year Psychology', quote: 'My stress levels dropped significantly after using HeronPulse.', avatar: '/avatar-5.jpg' },
    { name: 'Taylor', year: '3rd Year Pre-med', quote: 'The course breakdown helps me know exactly where to focus.', avatar: '/avatar-6.jpg' },
  ];
  return (
    <section id="testimonials" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-medium text-[#0055A4] uppercase tracking-wider">Testimonials</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Loved by students</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">See what your peers are saying</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div><h4 className="font-semibold text-gray-900 dark:text-white">{t.name}</h4><p className="text-sm text-gray-500">{t.year}</p></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">"{t.quote}"</p>
              <div className="mt-4 flex gap-1">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ onLoginClick }: { onLoginClick: () => void }) => (
  <section className="py-24 bg-gradient-to-br from-[#0055A4] to-[#003d7a] relative overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl" />
    </div>
    <div className="relative max-w-4xl mx-auto px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">Ready to take control of your semester?</h2>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">Join thousands of students already using HeronPulse to stay organized and stress-free.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onLoginClick} className="w-full sm:w-auto px-8 py-4 bg-white text-[#0055A4] rounded-xl font-semibold hover:bg-gray-100 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg">Get started<ArrowRight className="w-5 h-5" /></button>
          <button onClick={onLoginClick} className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/10 flex items-center justify-center gap-2"><Play className="w-5 h-5" />View demo</button>
        </div>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-slate-900 text-white py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#0055A4] rounded-lg flex items-center justify-center"><Target className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold">HeronPulse</span>
          </div>
          <p className="text-slate-400 text-sm max-w-xs">Empowering UMAK CCIS students to achieve academic success through intelligent workload management.</p>
        </div>
        {Object.entries({ Product: ['Features', 'Pricing', 'Demo'], Company: ['About', 'Careers', 'Contact'], Resources: ['Blog', 'Help Center', 'API Docs'], Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] }).map(([cat, items]) => (
          <div key={cat}><h4 className="font-semibold mb-4">{cat}</h4><ul className="space-y-2">{items.map((item) => <li key={item}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{item}</a></li>)}</ul></div>
        ))}
      </div>
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-slate-400 text-sm">© 2025 HeronPulse. All rights reserved. Exclusively for UMAK CCIS.</p>
        <div className="flex items-center gap-4">
          {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => <a key={i} href="#" className="text-slate-400 hover:text-white transition-colors"><Icon className="w-5 h-5" /></a>)}
        </div>
      </div>
    </div>
  </footer>
);