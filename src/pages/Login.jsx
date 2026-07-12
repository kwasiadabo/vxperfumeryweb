import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '' });
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-gold';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl text-center">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
      <form onSubmit={submit} className="mt-8 space-y-3">
        {mode === 'register' && (
          <>
            <label className={labelClass}>First name *
              <input required value={form.firstName} onChange={set('firstName')} className={inputClass} />
            </label>
            <label className={labelClass}>Last name *
              <input required value={form.lastName} onChange={set('lastName')} className={inputClass} />
            </label>
            <label className={labelClass}>Phone number (for order SMS updates)
              <input value={form.phoneNumber} onChange={set('phoneNumber')} className={inputClass} />
            </label>
          </>
        )}
        <label className={labelClass}>Email *
          <input required type="email" value={form.email} onChange={set('email')} className={inputClass} />
        </label>
        <label className={labelClass}>Password *
          <input required type="password" value={form.password} onChange={set('password')} className={inputClass} />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="mt-4 w-full text-center text-sm text-black/50 hover:text-gold"
      >
        {mode === 'login' ? "New here? Create an account" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
