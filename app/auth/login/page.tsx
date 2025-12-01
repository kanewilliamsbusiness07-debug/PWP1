'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      console.log('Attempting sign in...');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      console.log('Sign in result:', result);

      if (!result) {
        throw new Error('Authentication failed. Please check your email and password.');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.ok) {
        console.log('Sign in successful, redirecting...');
        // Get the stored redirect path or default to client-information
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/client-information';
        sessionStorage.removeItem('redirectAfterLogin'); // Clear the stored path
        router.push(redirectPath);
      } else {
        throw new Error('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      if (!mounted.current) return;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-gold px-4 py-2 mr-2">
              <span className="text-2xl font-bold text-black">PWP</span>
            </div>
            <span className="text-2xl font-bold text-transparent bg-clip-text gradient-gold">Perpetual Wealth Partners</span>
          </div>
          <p className="text-gray-600">Financial Planning Portal</p>
        </div>

        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
            Sign in to access your financial planning tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="allan@pwp2026.com.au"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-600 hover:text-gray-900"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-gold text-black hover:opacity-90 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-yellow-600 hover:text-yellow-700"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Shield className="h-4 w-4 mr-2" />
                Secure login with enterprise-grade encryption
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Demo Accounts:</p>
          <p>Master Admin: ADMIN / ADMIN</p>
          <p>Advisor: advisor@aokperpetual.com / Demo123!</p>
        </div>
      </div>
    </div>
  );
}