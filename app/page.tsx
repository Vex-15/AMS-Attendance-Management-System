'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const demoAccounts = [
  { email: 'aarav.sharma0@mitaoe.edu.in', password: 'student123', role: 'Student' },
  { email: 'priya.patel1@mitaoe.edu.in', password: 'student123', role: 'Student' },
  { email: 'deshmukh@mitaoe.edu.in', password: 'teacher123', role: 'Teacher' },
  { email: 'admin@mitaoe.edu.in', password: 'admin123', role: 'Admin' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already logged in
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-lg">
                MA
              </div>
            </div>
            <CardTitle className="text-2xl text-center">MITAOE Attendance</CardTitle>
            <CardDescription className="text-center">
              Smart Academic Intelligence System
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="your.email@mitaoe.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-input border-border"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
              </div>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((account, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-xs h-auto py-2"
                  onClick={() => quickLogin(account.email, account.password)}
                  disabled={isLoading}
                >
                  <span className="font-semibold text-primary">{account.role}</span>
                  <span className="text-muted-foreground ml-2 truncate">{account.email}</span>
                </Button>
              ))}
            </div>

            <div className="bg-secondary/20 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Demo Credentials:</p>
              <ul className="space-y-1 text-xs">
                <li>• Students: Any demo account above</li>
                <li>• Teachers: Prof accounts (e.g., deshmukh@...)</li>
                <li>• Admin: admin@mitaoe.edu.in</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>MIT Academy of Engineering, Pune</p>
          <p className="text-xs mt-1">Attendance & Academic Intelligence Platform</p>
        </div>
      </div>
    </div>
  );
}
