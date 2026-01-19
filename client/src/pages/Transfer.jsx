import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/api';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle, ArrowRight, DollarSign, ChevronsUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Transfer = () => {
    const { user } = useAuth();
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    // Pre-select the user's first account if available
    useEffect(() => {
        if (user?.accounts && user.accounts.length > 0) {
            setFromAccountId(user.accounts[0].account_id);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (!fromAccountId) {
            setMessage({ type: 'error', text: 'Please select an account to transfer from.' });
            setLoading(false);
            return;
        }

        try {
            await apiClient.post('/transactions/transfer', {
                from_account_id: parseInt(fromAccountId, 10),
                to_account_id: parseInt(toAccountId, 10),
                amount: parseFloat(amount)
            });

            setMessage({ type: 'success', text: 'Transfer successful!' });
            setTimeout(() => navigate('/'), 2000); // Redirect to dashboard after 2s
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Transfer failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container min-h-screen pt-24 pb-12 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-lg relative overflow-hidden">
                <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        <Send size={24} />
                    </div>
                    Transfer Money
                </h2>

                <AnimatePresence>
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                        >
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">From Account</label>
                         <div className="relative">
                            <select
                                value={fromAccountId}
                                onChange={(e) => setFromAccountId(e.target.value)}
                                className="w-full text-lg appearance-none"
                                required
                            >
                                <option value="" disabled>Select your account</option>
                                {user?.accounts?.map(acc => (
                                    <option key={acc.account_id} value={acc.account_id}>
                                        {acc.account_type.toUpperCase()} (...{acc.account_number.slice(-4)}) - ${acc.balance.toFixed(2)}
                                    </option>
                                ))}
                            </select>
                            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">To Account ID</label>
                        <input
                            type="number"
                            value={toAccountId}
                            onChange={(e) => setToAccountId(e.target.value)}
                            placeholder="e.g. 1002"
                            className="w-full text-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0.01"
                                step="0.01"
                                className="w-full pl-12 text-4xl font-bold bg-transparent border-none focus:ring-0"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary w-full text-lg py-4" disabled={loading}>
                            {loading ? 'Processing...' : <span className="flex items-center justify-center gap-2">Send Funds <ArrowRight size={20} /></span>}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Transfer;