"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, validatePassword } from '@/contexts/AuthContext';
import ParticlesBackground from '@/components/particles/ParticlesBackground';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const { signUp } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validar senha em tempo real
        if (name === 'password') {
            const validation = validatePassword(value);
            setPasswordErrors(validation.errors);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validações
        if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Preencha todos os campos');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) {
            setError('A senha não atende aos requisitos de segurança');
            return;
        }

        setLoading(true);

        try {
            await signUp(formData.email, formData.password, formData.name, formData.username);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (): { strength: number; color: string; text: string } => {
        const errorsCount = passwordErrors.length;
        if (formData.password.length === 0) return { strength: 0, color: 'bg-gray-500', text: '' };
        if (errorsCount >= 4) return { strength: 25, color: 'bg-red-500', text: 'Muito fraca' };
        if (errorsCount === 3) return { strength: 50, color: 'bg-orange-500', text: 'Fraca' };
        if (errorsCount === 2) return { strength: 75, color: 'bg-yellow-500', text: 'Média' };
        if (errorsCount === 1) return { strength: 90, color: 'bg-lime-500', text: 'Boa' };
        return { strength: 100, color: 'bg-green-500', text: 'Forte' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <main className="min-h-screen w-full relative overflow-hidden flex items-center justify-center py-12">
            {/* Background */}
            <div className="fixed inset-0 -z-20">
                <div className="animated-gradient absolute inset-0" />
                <div className="absolute inset-0 gradient-overlay" />
            </div>
            <div className="fixed inset-0 -z-10">
                <ParticlesBackground />
            </div>

            {/* Signup Card */}
            <div className="w-full max-w-md px-6">
                <div className="glass-card p-8 rounded-2xl">
                    {/* Logo/Title */}
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Criar Conta
                        </h1>
                        <p className="text-gray-300 text-sm">Comece sua jornada no CineGênio</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                                Nome Completo
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                placeholder="João Silva"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                                Nome de Usuário
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                placeholder="joaosilva"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                placeholder="seu@email.com"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                placeholder="••••••••"
                                disabled={loading}
                            />

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                style={{ width: `${passwordStrength.strength}%` }}
                                            />
                                        </div>
                                        {passwordStrength.text && (
                                            <span className="text-xs text-gray-400">{passwordStrength.text}</span>
                                        )}
                                    </div>

                                    {/* Password Requirements */}
                                    {passwordErrors.length > 0 && (
                                        <div className="mt-2 text-xs space-y-1">
                                            {passwordErrors.map((err, idx) => (
                                                <p key={idx} className="text-red-300">• {err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                                Confirmar Senha
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="mt-1 text-xs text-red-300">As senhas não coincidem</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || passwordErrors.length > 0}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
                        >
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-xs mt-6">
                    Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
            </div>
        </main>
    );
}
