'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogIn, GraduationCap, BookOpen, Shield, Eye, EyeOff, Sparkles, Mail, Lock } from 'lucide-react';

const demoAccounts = [
  { email: 'aarav.sharma0@mitaoe.edu.in', password: 'student123', role: 'Student', icon: GraduationCap, color: 'from-blue-500 to-cyan-500' },
  { email: 'deshmukh@mitaoe.edu.in', password: 'teacher123', role: 'Teacher', icon: BookOpen, color: 'from-violet-500 to-purple-500' },
  { email: 'admin@mitaoe.edu.in', password: 'admin123', role: 'Admin', icon: Shield, color: 'from-amber-500 to-orange-500' },
];

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(99, 144, 255, ${Math.random() * 0.3 + 0.1})`,
            animationDuration: `${Math.random() * 6 + 4}s`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
      {/* Large glowing blobs */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/[0.07] blur-[120px] -top-64 -left-32 animate-glow" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/[0.07] blur-[100px] -bottom-48 -right-48 animate-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/[0.05] blur-[80px] top-1/3 right-1/4 animate-glow" style={{ animationDelay: '3s' }} />
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('mitaoe_user') || '{}');
      if (user.role === 'student') router.push('/dashboard/student');
      else if (user.role === 'teacher') router.push('/dashboard/teacher');
      else if (user.role === 'admin') router.push('/dashboard/admin');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('mitaoe_user') || '{}');
      if (user.role === 'student') router.push('/dashboard/student');
      else if (user.role === 'teacher') router.push('/dashboard/teacher');
      else if (user.role === 'admin') router.push('/dashboard/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setError('');
    setIsLoading(true);
    setEmail(email);

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('mitaoe_user') || '{}');
      if (user.role === 'student') router.push('/dashboard/student');
      else if (user.role === 'teacher') router.push('/dashboard/teacher');
      else if (user.role === 'admin') router.push('/dashboard/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#0a0e1a]">
      <FloatingParticles />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + Title */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-1">MITAOE</h1>
          <p className="text-slate-400 text-sm flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Smart Attendance & Academic Intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {error && (
            <Alert variant="destructive" className="mb-5 bg-red-500/10 border-red-500/30 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="your.email@mitaoe.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="glass-input h-11 pl-4 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 border-white/10 bg-white/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="glass-input h-11 pl-4 pr-10 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 border-white/10 bg-white/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 gradient-btn text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Access Cards */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Quick Demo Access</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {demoAccounts.map((account, i) => {
              const Icon = account.icon;
              return (
                <button
                  key={i}
                  onClick={() => quickLogin(account.email, account.password)}
                  disabled={isLoading}
                  className="glass-card-hover rounded-xl p-3 text-center group disabled:opacity-50"
                >
                  <div className={`w-9 h-9 mx-auto rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white text-xs font-semibold">{account.role}</p>
                  <p className="text-slate-500 text-[9px] mt-0.5 truncate">{account.email.split('@')[0]}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-slate-500 text-xs">MIT Academy of Engineering, Pune</p>
          <p className="text-slate-600 text-[10px] mt-1">Attendance & Academic Intelligence Platform v2.0</p>
        </div>
      </div>
    </div>
  );
}
