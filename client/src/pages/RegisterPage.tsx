import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

interface FormState { name: string; email: string; password: string; confirm: string; }
type FormErrors = Partial<FormState>;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain an uppercase letter.';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      navigate('/analyze');
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
    className: errors[key] ? 'border-destructive focus-visible:ring-destructive' : '',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-tight">
            Health<strong className="font-bold">Lens</strong>
          </h1>
          <p className="text-white/45 mt-2 text-sm">Create your account</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Get started for free</CardTitle>
            <CardDescription>Fill in your details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            {apiError && (
              <Alert variant="destructive" className="mb-4" aria-live="assertive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full name</Label>
                <Input id="reg-name" {...field('name')} autoComplete="name" placeholder="Jane Smith" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email address</Label>
                <Input id="reg-email" type="email" {...field('email')} autoComplete="email" placeholder="you@example.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    {...field('password')}
                    autoComplete="new-password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className={(errors.password ? 'border-destructive focus-visible:ring-destructive ' : '') + 'pr-10'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    {...field('confirm')}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className={(errors.confirm ? 'border-destructive focus-visible:ring-destructive ' : '') + 'pr-10'}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
              </div>

              <Button type="submit" className="w-full bg-[#0D8A6E] hover:bg-[#0b7a61]" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>

            <p className="mt-5 text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0D8A6E] hover:underline font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-white/30 text-[11px] mt-5">
          No health data is stored on our servers.
        </p>
      </div>
    </div>
  );
}
