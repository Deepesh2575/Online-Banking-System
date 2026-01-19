import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/api';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRightLeft, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth(); // The user object now contains accounts

    const fetchTransactions = async () => {
        if (!user?.accounts || user.accounts.length === 0) {
            return; // No accounts to fetch transactions for
        }

        setIsLoading(true);
        try {
            // Create an array of promises for all transaction fetch calls
            const transactionPromises = user.accounts.map(account =>
                apiClient.get(`/transactions/${account.account_id}`)
            );

            // Wait for all promises to resolve
            const responses = await Promise.all(transactionPromises);

            // Flatten the array of arrays of transactions and sort by date
            const allTransactions = responses
                .flatMap(res => res.data)
                .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

            setTransactions(allTransactions);

        } catch (error) {
            console.error('Error fetching transactions', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch transactions when the component mounts or when user accounts change
    useEffect(() => {
        fetchTransactions();
    }, [user]);

    if (!user) {
        // This can be a loading spinner or null while auth context is loading
        return null;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="container min-h-screen pt-24 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Welcome, {user.first_name}
                    </h1>
                    <p className="text-muted">Here's what's happening with your money.</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchTransactions} className="btn glass-panel" disabled={isLoading}>
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} style={{ marginRight: '0.5rem' }} />
                    {isLoading ? 'Syncing...' : 'Refresh Data'}
                </motion.button>
            </header>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {user.accounts.map((acc, index) => (
                    <motion.div
                        key={acc.account_id}
                        variants={itemVariants}
                        className="glass-card relative overflow-hidden group"
                        style={{ background: index === 0 ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--surface-glass)', border: index === 0 ? 'none' : '1px solid var(--border-glass)' }}
                    >
                        {index === 0 && (
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        )}

                        <div className="relative z-10 flex flex-col h-full justify-between" style={{ minHeight: '160px' }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium opacity-80 mb-1" style={{ color: index === 0 ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{acc.account_type.toUpperCase()}</p>
                                    <h3 className="text-2xl font-bold font-display" style={{ fontSize: '2rem' }}>${Number(acc.balance).toFixed(2)}</h3>
                                </div>
                                <div className="p-2 rounded-lg bg-white/10">
                                    <DollarSign size={20} color={index === 0 ? 'white' : 'var(--primary)'} />
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="flex items-center gap-2 text-sm opacity-70">
                                    <CreditCard size={14} />
                                    <span>•••• {acc.account_number.slice(-4)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Calendar size={24} className="text-primary" />
                    Recent Activity
                </h2>
                <div className="glass-panel rounded-2xl overflow-hidden p-1">
                    <div className="transaction-list space-y-1">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted">
                                No transactions found.
                            </div>
                        ) : (
                            transactions.map((t, i) => {
                                const isOutgoing = t.transaction_type === 'withdrawal' || t.transaction_type === 'transfer_out';
                                const isIncoming = t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in';

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={t.transaction_id}
                                        className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: isIncoming ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isIncoming ? 'var(--success)' : 'var(--danger)' }}
                                            >
                                                {t.transaction_type.includes('transfer') ? <ArrowRightLeft size={18} /> : isIncoming ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                            </div>
                                            <div>
                                                <div className="font-medium">{t.description || (t.transaction_type.charAt(0).toUpperCase() + t.transaction_type.slice(1))}</div>
                                                <div className="text-xs text-muted">
                                                    {new Date(t.transaction_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-bold font-display" style={{ color: isIncoming ? 'var(--success)' : 'var(--danger)', fontSize: '1.1rem' }}>
                                            {isOutgoing ? '-' : '+'}${Number(t.amount).toFixed(2)}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;