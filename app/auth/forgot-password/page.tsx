'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // TODO: Implement password reset functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('If an account exists with this email, you will receive password reset instructions.');
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`mb-4 p-3 text-sm rounded-lg ${
                message.includes('error') 
                  ? 'text-red-800 bg-red-50' 
                  : 'text-green-800 bg-green-50'
              }`} role="alert">
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="advisor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-gold text-black hover:opacity-90 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/auth/login" 
                className="text-sm text-yellow-600 hover:text-yellow-700"
              >
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

