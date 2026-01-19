import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, ShieldCheck, AtSign } from 'lucide-react';

const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstName || !lastName) {
            setError("Please enter your full name.");
            return;
        }

        setIsLoading(true);
        const userData = {
            firstName,
            lastName,
            email,
            username,
            password
        };
        const res = await register(userData);
        setIsLoading(false);
        if (res.success) {
            // Optionally show a success message before redirecting
            navigate('/login');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Background Elements */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: -1, pointerEvents: 'none' }}>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2], }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card w-full max-w-md"
                style={{ width: '100%', maxWidth: '420px', backdropFilter: 'blur(20px)' }}
            >
                <div className="text-center mb-8">
                    <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={40} className="text-secondary" style={{ color: 'var(--secondary)' }} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                    <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Join the future of banking today</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '8px' }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex space-x-4" style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                        <div className="space-y-2 w-1/2">
                            <label className="text-sm font-medium text-gray-300">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" placeholder="John" required />
                            </div>
                        </div>
                        <div className="space-y-2 w-1/2">
                            <label className="text-sm font-medium text-gray-300">Last Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="pl-10" placeholder="Doe" required />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2" style={{ marginBottom: '1rem' }}>
                        <label className="text-sm font-medium text-gray-300">Username</label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" placeholder="johndoe" required />
                        </div>
                    </div>
                    
                    <div className="space-y-2" style={{ marginBottom: '1rem' }}>
                        <label className="text-sm font-medium text-gray-300">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="name@example.com" required />
                        </div>
                    </div>

                    <div className="space-y-2" style={{ marginBottom: '1.5rem' }}>
                        <label className="text-sm font-medium text-gray-300">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="••••••••" required />
                        </div>
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Create Account <ArrowRight size={18} /></>}
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-primary hover:text-primary-400 font-medium">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;