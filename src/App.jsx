import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. THE LOGIN SCREEN COMPONENT ---
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    let { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else if (isSignUp) {
      setMessage("Account created! You can now sign in.");
      setIsSignUp(false);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center min-h-screen z-10 relative px-4">
      <motion.div initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className="w-full max-w-md p-8 bg-[#12121a]/80 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 mb-2">
            Apex-AI
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-slate-400 text-sm uppercase tracking-widest font-semibold">
            Enter the Terminal
          </motion.p>
        </div>

        <form onSubmit={handleAuth} className="relative z-10 flex flex-col gap-5">
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all placeholder:text-slate-600" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all placeholder:text-slate-600" />
          {message && <p className={`text-sm text-center font-bold ${message.includes('Error') || message.includes('Invalid') ? 'text-red-400' : 'text-emerald-400'}`}>{message}</p>}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50">
            {loading ? "Authenticating..." : (isSignUp ? "Create Account" : "Access Dashboard")}
          </motion.button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer">
            {isSignUp ? "Already have an account? Sign In" : "Need access? Create Account"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- 2. THE MAIN APP WRAPPER ---
export default function App() {
  const [session, setSession] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      <motion.div animate={{ x: mousePos.x - 300, y: mousePos.y - 300 }} transition={{ type: "tween", ease: "easeOut", duration: 0.5 }} className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] z-0" />
      <AnimatePresence mode="wait">
        {/* Pass the session to the Dashboard! */}
        {!session ? <LoginScreen key="login" /> : <Dashboard key="dashboard" session={session} />}
      </AnimatePresence>
    </div>
  );
}

// --- 3. THE DASHBOARD ---
// Receive the session prop here
function Dashboard({ session }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('AAPL');
  const [activeTicker, setActiveTicker] = useState('AAPL');
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => { 
    if(session) fetchWatchlist(); 
  }, [session]);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      setChartData([]); 
      try {
        const response = await fetch(`https://apex-ai-backend-1.onrender.com/predict/${activeTicker}`);
        if (!response.ok) throw new Error('API is waking up or failed. Please try again in 30 seconds.');
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        
        const formattedData = [];
        const historyObj = result.historical_close[activeTicker];
        Object.keys(historyObj).forEach((dateString) => {
          const date = new Date(dateString);
          formattedData.push({ name: `${date.getMonth() + 1}/${date.getDate()}`, Actual: historyObj[dateString], Predicted: null });
        });

        if (formattedData.length > 0) formattedData[formattedData.length - 1].Predicted = formattedData[formattedData.length - 1].Actual;

        const predictionObj = result.predictions;
        let dayCount = 1;
        Object.keys(predictionObj).forEach((key) => {
          formattedData.push({ name: `Day +${dayCount}`, Actual: null, Predicted: predictionObj[key] });
          dayCount++;
        });

        setChartData(formattedData);
      } catch (error) { setError(error.message); } finally { setLoading(false); }
    };
    fetchPrediction();
  }, [activeTicker]);

  // PRIVATE WATCHLIST FETCH
  const fetchWatchlist = async () => {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', session.user.id); // Only get THIS user's stocks
      
    if (!error && data) setWatchlist(data);
  };

  // PRIVATE WATCHLIST SAVE
  const addToWatchlist = async () => {
    if (watchlist.some(item => item.ticker === activeTicker)) return alert(`${activeTicker} is already saved!`);
    
    const { error } = await supabase
      .from('watchlist')
      .insert([{ ticker: activeTicker, user_id: session.user.id }]); // Save with user ID
      
    if (error) alert("Error saving to database!");
    else fetchWatchlist();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim() !== '') setActiveTicker(searchInput.toUpperCase());
  };

  const handleSignOut = async () => await supabase.auth.signOut();

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto p-4 md:p-8 relative z-10">
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-4">
         <span className="text-slate-500 text-xs tracking-widest uppercase">Logged in as: {session.user.email}</span>
         <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 text-xs font-bold tracking-widest transition-colors cursor-pointer">
           [ SIGN OUT ]
         </button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-emerald-400 to-teal-300 drop-shadow-lg">
            Apex-AI Predictor
          </h1>
          <p className="text-slate-400 mt-2 font-medium tracking-wide text-sm uppercase">Deep Learning LSTM Stock Forecasting</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-3">
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="e.g. NVDA, TSLA" className="w-full md:w-56 px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase text-white shadow-inner backdrop-blur-md transition-all font-bold tracking-wider" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-colors tracking-wide">
            SCAN
          </motion.button>
        </form>
      </motion.div>

      {watchlist.length > 0 && (
        <motion.div variants={itemVariants} className="mb-10">
          <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-[0.2em]">My Watchlist</h4>
          <div className="flex gap-3 flex-wrap">
            {watchlist.map((item) => (
              <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.9 }} key={item.id} onClick={() => { setActiveTicker(item.ticker); setSearchInput(item.ticker); }} className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg border ${activeTicker === item.ticker ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                {item.ticker}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex justify-between items-end mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">Target: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">{activeTicker}</span></h2>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={addToWatchlist} className="px-5 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-sm transition-colors hover:bg-amber-500/20">
          ★ Save Target
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 font-medium backdrop-blur-md">⚠ {error}</motion.div>}
      </AnimatePresence>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[500px] bg-white/5 border border-white/5 rounded-3xl mb-8 backdrop-blur-sm text-center p-6">
          <motion.div animate={{ borderRadius: ["20%", "50%", "20%"], rotate: [0, 180, 360], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] mb-8" />
          <p className="text-white font-bold tracking-widest uppercase text-sm animate-pulse">Running Neural Network</p>
          <p className="text-slate-500 text-xs mt-3 uppercase tracking-wider">Predicting {activeTicker} via LSTM. First run may take a minute...</p>
        </motion.div>
      )}

      {!loading && chartData.length > 0 && (
        <motion.div variants={itemVariants} className="w-full h-[550px] bg-[#12121a] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-xl">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val.toFixed(0)}`} axisLine={false} tickLine={false} /> 
              <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff20', borderRadius: '16px' }} itemStyle={{ fontWeight: 'bold' }} />
              <Legend />
              <Line type="monotone" name="Historical Price" dataKey="Actual" stroke="#818cf8" strokeWidth={4} dot={{ r: 5, fill: '#818cf8', stroke: '#12121a' }} />
              <Line type="monotone" name="AI Forecast" dataKey="Predicted" stroke="#34d399" strokeWidth={4} strokeDasharray="8 8" dot={{ r: 5, fill: '#34d399', stroke: '#12121a' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  );
}