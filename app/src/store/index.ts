import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type View = 'landing' | 'login' | 'signup' | 'dashboard';
export type DashboardView = 'overview' | 'tasks' | 'calendar' | 'courses' | 'projects' | 'chat' | 'leaderboard' | 'analytics' | 'settings';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isDemo?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  course: string;
  subtasks: { id: string; title: string; completed: boolean }[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  progress: number;
  grade: number;
  hoursPerWeek: number;
  color: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  channel: string;
}

interface AppState {
  currentView: View;
  dashboardView: DashboardView;
  setCurrentView: (view: View) => void;
  setDashboardView: (view: DashboardView) => void;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (email: string) => Promise<boolean>;
  logout: () => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: () => number;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: Task['status']) => void;
  courses: Course[];
  pomodoroTime: number;
  pomodoroActive: boolean;
  pomodoroMode: 'focus' | 'shortBreak' | 'longBreak';
  completedSessions: number;
  totalFocusTime: number;
  setPomodoroTime: (time: number) => void;
  setPomodoroActive: (active: boolean) => void;
  setPomodoroMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
  incrementSessions: () => void;
  addFocusTime: (minutes: number) => void;
  streak: number;
  lastActiveDate: string | null;
  updateStreak: () => void;
  badges: Badge[];
  earnedBadges: string[];
  earnBadge: (badgeId: string) => void;
  messages: ChatMessage[];
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

const DEMO_EMAIL = 'reinernuevas.acads@gmail.com';
const DEMO_PASSWORD = '@CSFDSARein03082026';

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Complete CS101 Assignment',
    description: 'Finish the programming exercise on data structures',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    course: 'CS101',
    subtasks: [
      { id: 's1', title: 'Read chapter 4', completed: true },
      { id: 's2', title: 'Write code', completed: false },
      { id: 's3', title: 'Test solutions', completed: false },
    ],
  },
  {
    id: '2',
    title: 'Study for Math Exam',
    description: 'Review calculus concepts for midterm',
    status: 'todo',
    priority: 'high',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    course: 'MATH201',
    subtasks: [
      { id: 's4', title: 'Review derivatives', completed: false },
      { id: 's5', title: 'Practice integrals', completed: false },
    ],
  },
  {
    id: '3',
    title: 'Write Essay Draft',
    description: 'First draft of research paper',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    course: 'ENG102',
    subtasks: [],
  },
  {
    id: '4',
    title: 'Lab Report',
    description: 'Submit physics lab report',
    status: 'review',
    priority: 'medium',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    course: 'PHY101',
    subtasks: [
      { id: 's6', title: 'Analyze data', completed: true },
      { id: 's7', title: 'Write conclusion', completed: true },
    ],
  },
  {
    id: '5',
    title: 'Group Project Meeting',
    description: 'Discuss project timeline with team',
    status: 'done',
    priority: 'low',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    course: 'CS201',
    subtasks: [],
  },
];

const initialCourses: Course[] = [
  { id: '1', code: 'CS101', name: 'Intro to Computer Science', progress: 85, grade: 92, hoursPerWeek: 12, color: '#6B46C1' },
  { id: '2', code: 'MATH201', name: 'Calculus II', progress: 72, grade: 88, hoursPerWeek: 10, color: '#10B981' },
  { id: '3', code: 'ENG102', name: 'Academic Writing', progress: 90, grade: 95, hoursPerWeek: 8, color: '#F59E0B' },
  { id: '4', code: 'PHY101', name: 'Physics I', progress: 68, grade: 84, hoursPerWeek: 14, color: '#EF4444' },
  { id: '5', code: 'CS201', name: 'Data Structures', progress: 78, grade: 89, hoursPerWeek: 11, color: '#3B82F6' },
];

const initialBadges: Badge[] = [
  { id: '1', name: 'First Steps', description: 'Complete your first task', icon: 'footprints', tier: 'bronze' },
  { id: '2', name: 'Focus Master', description: 'Complete 10 focus sessions', icon: 'target', tier: 'silver' },
  { id: '3', name: 'Task Champion', description: 'Complete 50 tasks', icon: 'trophy', tier: 'gold' },
  { id: '4', name: 'Streak Keeper', description: 'Maintain a 7-day streak', icon: 'flame', tier: 'silver' },
  { id: '5', name: 'Early Bird', description: 'Complete 5 tasks before their due date', icon: 'sunrise', tier: 'bronze' },
  { id: '6', name: 'Dean\'s Lister', description: 'Maintain a GPA above 90%', icon: 'graduation-cap', tier: 'platinum' },
];

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    senderId: '2',
    senderName: 'Sarah Chen',
    senderAvatar: '/avatar-1.jpg',
    content: 'Hey! Did you finish the CS101 assignment?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    channel: 'general',
  },
  {
    id: '2',
    senderId: '3',
    senderName: 'Mike Johnson',
    senderAvatar: '/avatar-2.jpg',
    content: 'Almost done! Just need to test my code.',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    channel: 'general',
  },
  {
    id: '3',
    senderId: '1',
    senderName: 'You',
    content: 'I can help review if anyone needs it!',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    channel: 'general',
  },
  {
    id: '4',
    senderId: '4',
    senderName: 'Emma Davis',
    senderAvatar: '/avatar-3.jpg',
    content: 'That would be great! Thanks!',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    channel: 'general',
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'landing',
      dashboardView: 'overview',
      setCurrentView: (view) => set({ currentView: view }),
      setDashboardView: (view) => set({ dashboardView: view }),
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          const user = {
            id: '1',
            email: DEMO_EMAIL,
            name: 'Reiner Nuevas',
            avatar: '/avatar-1.jpg',
            isDemo: true,
          };
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      loginWithGoogle: async (email) => {
        if (email.endsWith('@umak.edu.ph')) {
          const user = {
            id: '2',
            email,
            name: email.split('@')[0],
            isDemo: false,
          };
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, currentView: 'landing' });
      },
      notifications: [],
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
        };
        set((state) => ({ notifications: [newNotification, ...state.notifications] }));
      },
      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      clearNotifications: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
      tasks: initialTasks,
      addTask: (task) => {
        const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },
      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },
      moveTask: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        }));
      },
      courses: initialCourses,
      pomodoroTime: 25 * 60,
      pomodoroActive: false,
      pomodoroMode: 'focus',
      completedSessions: 0,
      totalFocusTime: 0,
      setPomodoroTime: (time) => set({ pomodoroTime: time }),
      setPomodoroActive: (active) => set({ pomodoroActive: active }),
      setPomodoroMode: (mode) => {
        const times = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
        set({ pomodoroMode: mode, pomodoroTime: times[mode] });
      },
      incrementSessions: () => {
        set((state) => ({ completedSessions: state.completedSessions + 1 }));
      },
      addFocusTime: (minutes) => {
        set((state) => ({ totalFocusTime: state.totalFocusTime + minutes }));
      },
      streak: 5,
      lastActiveDate: new Date().toISOString().split('T')[0],
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastActive = get().lastActiveDate;
        if (lastActive === today) return;
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (lastActive === yesterday) {
          set((state) => ({ streak: state.streak + 1, lastActiveDate: today }));
        } else {
          set({ streak: 1, lastActiveDate: today });
        }
      },
      badges: initialBadges,
      earnedBadges: ['1', '4'],
      earnBadge: (badgeId) => {
        if (!get().earnedBadges.includes(badgeId)) {
          set((state) => ({ earnedBadges: [...state.earnedBadges, badgeId] }));
          const badge = get().badges.find((b) => b.id === badgeId);
          if (badge) {
            get().addNotification({
              title: 'Badge Earned!',
              message: `You earned the ${badge.name} badge!`,
              type: 'success',
              read: false,
            });
          }
        }
      },
      messages: initialMessages,
      sendMessage: (message) => {
        const newMessage = {
          ...message,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
      },
    }),
    {
      name: 'heronpulse-storage',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tasks: state.tasks,
        completedSessions: state.completedSessions,
        totalFocusTime: state.totalFocusTime,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        earnedBadges: state.earnedBadges,
      }),
    }
  )
);