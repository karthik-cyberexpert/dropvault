import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { 
  UploadCloud, File, X, Clock, Lock, Sparkles, Copy, QrCode, 
  ArrowRight, ShieldAlert, CheckCircle2, RotateCcw, Database, 
  History, Shield, Trash2, Calendar, FileText, Key, Download as DownloadIcon,
  Play, FileImage, FileVideo, Eye, EyeOff, HelpCircle, Loader2, ArrowLeft, Link as LinkIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Toast Notification Context
const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

// Determine API Base URL dynamically (Checks query string "node" for tunnels or localStorage)
export const getApiBase = () => {
  const params = new URLSearchParams(window.location.search);
  let nodeParam = params.get('node');
  if (nodeParam) {
    if (!nodeParam.startsWith('http://') && !nodeParam.startsWith('https://')) {
      nodeParam = `https://${nodeParam}`;
    }
    return `${nodeParam}/api`;
  }
  const savedNode = localStorage.getItem('dropvault_node_url');
  if (savedNode) {
    return `${savedNode}/api`;
  }
  return 'http://localhost:15299/api';
};

export default function App() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Router>
        <div className="relative min-h-screen bg-[#060913] text-gray-150 flex flex-col items-center justify-center gap-6 p-4 overflow-x-hidden antialiased select-none">
          
          {/* Subtle Royal Blue Background Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-blue-900/10 blur-[120px] animate-float-slow pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-800/10 blur-[120px] animate-float-medium pointer-events-none z-0" />

          {/* Central Widget */}
          <MainWidget />

          {/* Page Bottom Footer Ticker */}
          {!window.location.pathname.includes('/download/') && (
            <div className="fixed bottom-0 left-0 w-full z-30 bg-[#070b16]/80 backdrop-blur-md border-t border-white/5 py-2.5 overflow-hidden select-none">
              <div className="flex animate-marquee whitespace-nowrap text-[10px] font-medium tracking-wide text-slate-400">
                <span className="px-8 shrink-0 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span><strong>Hosting Notice:</strong> All files are served directly from your machine. Once the local backend node or Command Prompt window is closed, your sharing links will immediately become invalid.</span>
                </span>
                <span className="px-8 shrink-0 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span><strong>Hosting Notice:</strong> All files are served directly from your machine. Once the local backend node or Command Prompt window is closed, your sharing links will immediately become invalid.</span>
                </span>
              </div>
            </div>
          )}

          {/* Toast Container */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
            <AnimatePresence>
              {toasts.map(toast => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md border ${
                    toast.type === 'error'
                      ? 'bg-red-950/70 border-red-500/30 text-red-200'
                      : toast.type === 'info'
                      ? 'bg-blue-950/70 border-blue-500/30 text-blue-200'
                      : 'bg-blue-950/70 border-blue-500/30 text-blue-200'
                  }`}
                >
                  {toast.type === 'error' ? (
                    <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : toast.type === 'info' ? (
                    <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">{toast.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      </Router>
    </ToastContext.Provider>
  );
}

// -------------------------------------------------------------
// Component: Main Widget (Single centered element)
// -------------------------------------------------------------
function MainWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRecent, setShowRecent] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const handleRecentToggle = () => {
    setShowRecent(prev => !prev);
    if (location.pathname !== '/') navigate('/');
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const cardWidthClass = showRecent ? 'max-w-3xl' : 'max-w-lg';

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={`w-full ${cardWidthClass} glass-panel-glow rounded-[24px] p-7 shadow-2xl relative overflow-hidden z-10`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
        {showRecent ? (
          <>
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-blue-500" />
              <span className="font-extrabold text-xl tracking-tight text-white">
                Recent Links History
              </span>
            </div>
            <button
              onClick={() => setShowRecent(false)}
              className="w-9 h-9 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Close History"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div>
              <div 
                onClick={() => { navigate('/'); setShowRecent(false); }}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="p-2 bg-blue-650 rounded-xl shrink-0 shadow-lg shadow-blue-500/10">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  DropVault
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-2 font-medium">
                Share your files. Secure your link. Beautifully simple.
              </p>
            </div>

            {/* Action Controls */}
            {location.pathname === '/' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowHelp(true)}
                  className="w-9 h-9 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="How to Use Guide"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRecentToggle}
                  className="w-9 h-9 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="View History"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {location.pathname.startsWith('/download/') && (
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-blue-400 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Lock className="w-3 h-3" />
            <span>Secure Node</span>
          </div>
        )}
      </div>

      {/* Main Area */}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            showRecent ? (
              <RecentView refreshTrigger={refreshTrigger} />
            ) : (
              <StepperUploadView onUploadComplete={handleUploadSuccess} />
            )
          } />
          <Route path="/download/:id" element={<DownloadView />} />
          <Route path="/expired" element={<ExpiredView />} />
          <Route path="*" element={<StepperUploadView onUploadComplete={handleUploadSuccess} />} />
        </Routes>
      </AnimatePresence>

      {/* Help Dialog Modal Overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#0e1320] border border-white/5 rounded-3xl p-6 w-full max-w-xs relative space-y-4 shadow-2xl"
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 text-blue-400">
                <HelpCircle className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-sm text-white">How to Host Files</h3>
              </div>

              <div className="space-y-3.5 text-xs text-slate-350 leading-relaxed pt-2">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">1</span>
                  <p>Drag and drop your files into the primary upload area.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">2</span>
                  <p>Configure options including access passwords or one-time download restrictions.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">3</span>
                  <p>Generate your link. A secure public tunnel will map directly to your local computer.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Component: Stepper Upload Flow (Three Steps)
// -------------------------------------------------------------
function StepperUploadView({ onUploadComplete }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    return (
      <div className="flex flex-col items-center text-center py-6 space-y-5 animate-fade-in">
        <div className="p-3.5 bg-red-500/10 rounded-full border border-red-500/20 text-red-400">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h2 className="text-base font-bold text-white">Desktop System Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
          DropVault hosts files directly from your computer using a local node backend. File hosting is only supported on laptop or desktop devices.
        </p>
        <div className="text-[10px] text-slate-500 font-mono pt-3 border-t border-white/5 w-full">
          Mobile web browsers cannot bind local storage ports.
        </div>
      </div>
    );
  }

  // Stepper states
  const [step, setStep] = useState(1); // 1: Files, 2: Settings, 3: Success/Progress
  
  // Data states
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [expiryHours, setExpiryHours] = useState('24');
  const [password, setPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [oneTime, setOneTime] = useState(false);
  const [dynamicLimit, setDynamicLimit] = useState(100 * 1024 * 1024); // Default 100MB

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareData, setShareData] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // Local Node Connection states
  const [nodeOnline, setNodeOnline] = useState(false);
  const [checkingNode, setCheckingNode] = useState(true);
  const [cmdCopied, setCmdCopied] = useState(false);
  const [nodePort, setNodePort] = useState(() => {
    const saved = localStorage.getItem('dropvault_node_url');
    if (saved) {
      const match = saved.match(/:(\d+)$/);
      if (match) return match[1];
    }
    return '15299';
  });

  const updatePort = (newPort) => {
    setNodePort(newPort);
    if (newPort) {
      localStorage.setItem('dropvault_node_url', `http://localhost:${newPort}`);
    } else {
      localStorage.removeItem('dropvault_node_url');
    }
  };





  // Node health polling effect
  useEffect(() => {
    let active = true;
    let timer;

    const pollHealth = async () => {
      try {
        const res = await axios.get(`${getApiBase()}/health`, { timeout: 1000 });
        if (res.data && res.data.status === 'ok') {
          if (active) {
            setNodeOnline(true);
            setCheckingNode(false);
            if (res.data.freeSpaceBytes) {
              setDynamicLimit(res.data.freeSpaceBytes);
            }
          }
          return;
        }
      } catch (e) {
        // Ignored
      }
      if (active) {
        setNodeOnline(false);
        setCheckingNode(false);
      }
    };

    pollHealth();
    timer = setInterval(pollHealth, 2500);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [nodePort]);

  // Client heartbeat connection to local node server
  useEffect(() => {
    if (!nodeOnline) return;

    let eventSource;
    try {
      // Connect to heartbeat endpoint using the dynamic API base resolved target
      const apiBase = getApiBase();
      const heartbeatUrl = apiBase.endsWith('/api') 
        ? `${apiBase.slice(0, -4)}/api/heartbeat` 
        : `${apiBase}/heartbeat`;

      eventSource = new EventSource(heartbeatUrl);
      
      eventSource.onerror = () => {
        // Silent catch for disconnects; the main health poller handles offline state transitions
      };
    } catch (e) {
      console.error('Failed to open heartbeat connection:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [nodeOnline, nodePort]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (incomingFiles) => {
    const totalCurrentSize = files.reduce((acc, f) => acc + f.size, 0);
    const incomingSize = incomingFiles.reduce((acc, f) => acc + f.size, 0);

    if (totalCurrentSize + incomingSize > dynamicLimit) {
      toast.showToast(`Total package size exceeds system limit of ${formatSize(dynamicLimit)}`, "error");
      return;
    }

    const processed = incomingFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      rawFile: file
    }));

    setFiles(prev => [...prev, ...processed]);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0) return;
    setStep(3);
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f.rawFile));
    formData.append('expiryHours', expiryHours);
    formData.append('password', password);
    formData.append('oneTime', oneTime);

    try {
      const response = await axios.post(`${getApiBase()}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      });

      if (response.data.success) {
        setShareData(response.data);
        toast.showToast("Vault package created!");

        // Add to client cache
        const recent = JSON.parse(localStorage.getItem('dropvault_recent') || '[]');
        const newRecentItem = {
          id: response.data.shareId,
          files: files.map(f => ({ name: f.name, size: f.size })),
          expiresAt: response.data.expiresAt,
          createdAt: new Date().toISOString(),
          tunnelUrl: response.data.tunnelUrl
        };
        localStorage.setItem('dropvault_recent', JSON.stringify([newRecentItem, ...recent].slice(0, 100))); // Allow scroll logs

        if (onUploadComplete) onUploadComplete();
      }
    } catch (err) {
      console.error(err);
      toast.showToast(err.response?.data?.error || "Upload failed", "error");
      setStep(2); // Go back to settings
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareData) {
      const shareUrl = `${window.location.origin}/download/${shareData.shareId}?node=${shareData.tunnelUrl || 'http://localhost:5000'}`;
      navigator.clipboard.writeText(shareUrl);
      toast.showToast("Sharing URL copied!");
    }
  };

  const resetAll = () => {
    setFiles([]);
    setStep(1);
    setShareData(null);
    setPassword('');
    setOneTime(false);
    setShowQR(false);
  };

  const shareUrl = shareData ? `${window.location.origin}/download/${shareData.shareId}?node=${shareData.tunnelUrl || 'http://localhost:15299'}` : '';

  if (!nodeOnline) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="flex flex-col items-center text-center py-6 space-y-5 animate-fade-in"
      >
        <div className="relative p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
          <Database className="w-8 h-8 text-blue-400" />
          <div className="absolute bottom-1 right-1 w-3 h-3 bg-yellow-500 border-2 border-[#060913] rounded-full animate-pulse" />
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Start Your Local Node</h2>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            DropVault hosts files directly from your computer. Open a terminal and run the command below to start the server.
          </p>
        </div>

        {/* Primary Command - Large & Prominent */}
        <div className="w-full bg-[#0e1320] p-5 rounded-2xl border border-white/5 text-left space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Run in Terminal</span>
            </div>
            <span className="text-[10px] text-slate-500 leading-normal block">
              Open PowerShell, CMD, or any terminal and paste this command:
            </span>
          </div>

          <button
            onClick={() => {
              const cmd = `npx -y dropvault-node --port ${nodePort}`;
              navigator.clipboard.writeText(cmd);
              setCmdCopied(true);
              
              // Silently try to open a terminal (no error if blocked)
              try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                iframe.contentWindow.location.href = 'ms-terminal:';
                setTimeout(() => { try { iframe.remove(); } catch(e) {} }, 1500);
              } catch(e) { /* silently ignore - user will paste manually */ }

              toast.showToast("Command copied! Paste it in your terminal.");
              setTimeout(() => setCmdCopied(false), 3000);
            }}
            className={`w-full flex items-center justify-between gap-2 p-3.5 px-4 rounded-xl border transition-all cursor-pointer group ${
              cmdCopied 
                ? 'bg-blue-500/10 border-blue-500/30' 
                : 'bg-[#0b0f19] border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5'
            }`}
          >
            <code className="text-sm text-blue-300 font-mono font-semibold select-all truncate">
              npx -y dropvault-node --port {nodePort}
            </code>
            <div className={`p-1.5 rounded-lg shrink-0 transition-all ${
              cmdCopied 
                ? 'bg-blue-500/20 text-blue-300' 
                : 'bg-white/5 border border-white/10 text-slate-400 group-hover:text-white group-hover:bg-white/10'
            }`}>
              {cmdCopied ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Quick Steps */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">1</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">Copy the command above (click it)</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">2</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">Open a terminal on your computer and paste it</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">3</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">This page will <strong className="text-blue-300">automatically connect</strong> once the server starts</p>
            </div>
          </div>
        </div>

        {/* Connection Port & Status */}
        <div className="w-full bg-[#0e1320] p-5 rounded-2xl border border-white/5 space-y-4 text-left">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300">Connection Port</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Port for local node server binding</span>
            </div>
            <input
              type="text"
              value={nodePort}
              onChange={(e) => updatePort(e.target.value.replace(/\D/g, ''))}
              placeholder="15299"
              className="w-24 h-9 rounded-xl bg-[#0b0f19] border border-white/5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-center font-mono placeholder:text-slate-600 text-slate-200"
            />
          </div>
          
          <div className="flex items-center gap-2.5 text-[10px] font-mono border-t border-white/5 pt-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
            <span className="text-slate-500">Waiting for node on <span className="text-blue-400">localhost:{nodePort}</span> ...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper Progress Bar */}
      {!shareData && (
        <div className="relative flex items-center justify-between px-6 pb-2 pt-2">
          {/* Background and Active Progress Line */}
          <div className="absolute top-[14px] left-[38px] right-[38px] h-[2px] bg-[#1a2233] z-0">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out" 
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />
          </div>

          {[
            { stepNum: 1, label: 'Files' },
            { stepNum: 2, label: 'Settings' },
            { stepNum: 3, label: 'Create' }
          ].map((item) => (
            <div key={item.stepNum} className="flex flex-col items-center gap-1.5 relative z-10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                step === item.stepNum
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10 scale-105'
                  : step > item.stepNum
                  ? 'bg-blue-950 border-blue-900 text-blue-400'
                  : 'bg-[#181f30] border-white/5 text-gray-500'
              }`}>
                {item.stepNum}
              </div>
              <span className={`text-[10px] font-semibold transition-colors duration-300 ${
                step === item.stepNum ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Steps Content switcher */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Drag drop area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`relative flex flex-col items-center justify-center border border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-white/10 hover:border-white/20 bg-black/25'
              }`}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => handleFiles(Array.from(e.target.files))}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-blue-500 mb-2.5 animate-float-medium" />
              <span className="text-xs font-semibold text-gray-300">Drag files here or browse</span>
              <span className="text-[10px] text-gray-500 mt-1 font-mono">Max package limit: {formatSize(dynamicLimit)}</span>
            </div>

            {/* Selected files listing */}
            {files.length > 0 && (
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                <div className="text-[10px] font-semibold text-gray-500">Vault Contents:</div>
                {files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b0f19] border border-white/5 text-xs">
                    <span className="truncate pr-4 font-semibold text-gray-300">{f.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-gray-500">{formatSize(f.size)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(item => item.id !== f.id)); }}
                        className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Button */}
            <button
              onClick={() => setStep(2)}
              disabled={files.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                files.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:scale-[1.01]'
                  : 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Configure Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="space-y-4 bg-[#0e1320] p-5 rounded-2xl border border-[#1e293b]">
              {/* Expiry Selector */}
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-350">Lifetime Link Expiry</span>
                <div className="flex bg-[#0b0f19] border border-white/5 p-1 rounded-xl">
                  {[
                    { id: '1', label: '1 Hour' },
                    { id: '24', label: '24 Hours' },
                    { id: '168', label: '7 Days' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExpiryHours(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        expiryHours === opt.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between gap-4 pt-3.5 border-t border-white/5">
                <span className="text-xs font-semibold text-slate-350">Access Key</span>
                <div className="relative max-w-[220px] w-full">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    placeholder="Protect password (optional)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-[#0b0f19] border border-white/5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-left placeholder:text-slate-500 text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPasswordText ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* One Time toggle */}
              <div className="flex items-center justify-between pt-3.5 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-350">One-Time Retrieval</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Permanently delete instantly after first download</span>
                </div>
                
                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setOneTime(!oneTime)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none flex items-center ${
                    oneTime ? 'bg-blue-600 shadow-lg shadow-blue-500/25' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                    oneTime ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-4 rounded-xl bg-[#1e2536] hover:bg-[#273047] text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleUploadSubmit}
                className="w-2/3 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <span>Upload & Generate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center py-4"
          >
            {uploading ? (
              // Loading Progress State
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                  <span className="text-sm font-bold font-mono text-white">{uploadProgress}%</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-200">Securing Vault Packet</h3>
                <p className="text-[10px] text-gray-500 mt-1 max-w-xs leading-normal">
                  Encrypting and placing payload on local node database. Keep this window open.
                </p>
              </div>
            ) : shareData ? (
              // Success Link Output State
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center"
              >
                <div className="p-2.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-3.5">
                  <CheckCircle2 className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <h2 className="text-lg font-bold mb-1">DropVault Link Ready</h2>
                <p className="text-xs text-gray-500 max-w-xs mb-6">
                  Security credentials generated. Anyone with this link can view details.
                </p>

                {/* Link Bar */}
                <div className="w-full flex items-center gap-2 p-1.5 rounded-xl bg-[#0b0f19] border border-white/5 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-grow bg-transparent border-none text-blue-300 font-mono text-xs pl-3 focus:ring-0 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-gray-300 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>

                {/* QR Toggle */}
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors mb-4"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQR ? 'Hide QR Code' : 'Show Mobile QR'}</span>
                </button>

                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-white rounded-xl mb-6 flex justify-center border shadow-2xl"
                    >
                      <QRCodeSVG value={shareUrl} size={110} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full border-t border-white/5 pt-4 flex items-center justify-between text-[9px] font-mono text-gray-500">
                  <span>Expires: {new Date(shareData.expiresAt).toLocaleTimeString()}</span>
                  <span>One-Time: {oneTime ? 'YES' : 'NO'}</span>
                </div>

                <button
                  onClick={resetAll}
                  className="mt-6 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Create new vault</span>
                </button>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// View: Recent Uploads Cache list
// -------------------------------------------------------------
function RecentView({ refreshTrigger }) {
  const toast = useToast();
  const [recent, setRecent] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadRecent();
  }, [refreshTrigger]);

  const loadRecent = () => {
    try {
      const items = JSON.parse(localStorage.getItem('dropvault_recent') || '[]');
      const validItems = items.filter(item => new Date(item.expiresAt) > new Date());
      setRecent(validItems);
      if (validItems.length !== items.length) {
        localStorage.setItem('dropvault_recent', JSON.stringify(validItems));
      }
    } catch (e) {
      setRecent([]);
    }
  };

  const copyLink = (item) => {
    const url = `${window.location.origin}/download/${item.id}?node=${item.tunnelUrl || 'http://localhost:15299'}`;
    navigator.clipboard.writeText(url);
    toast.showToast("URL copied!");
  };

  const deleteRecentItem = (id) => {
    const updated = recent.filter(item => item.id !== id);
    localStorage.setItem('dropvault_recent', JSON.stringify(updated));
    setRecent(updated);
    // Reset current page if it exceeds new bounds
    const totalPages = Math.ceil(updated.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    toast.showToast("Removed from local cache");
  };

  // Pagination calculation
  const totalPages = Math.ceil(recent.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = recent.slice(indexOfFirstItem, indexOfLastItem);

  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, '...', total - 1, total];
    }
    if (current >= total - 2) {
      return [1, 2, '...', total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {recent.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs font-medium">
          No active links in history.
        </div>
      ) : (
        <>
          {/* Grid Layout of Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentItems.map(item => {
              const url = `${window.location.origin}/download/${item.id}?node=${item.tunnelUrl || 'http://localhost:15299'}`;
              return (
                <div 
                  key={item.id} 
                  className="bg-[#0e1320] border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[140px] hover:border-blue-500/20 transition-all duration-300"
                >
                  <div>
                    {/* File Count Badge */}
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 rounded uppercase tracking-wider w-fit mb-2 block">
                      {item.files.length} {item.files.length === 1 ? 'FILE' : 'FILES'}
                    </span>
                    
                    {/* Truncated Link */}
                    <span className="text-[10px] text-slate-400 font-mono truncate block w-full mt-1.5" title={url}>
                      {url}
                    </span>
                    
                    {/* Hashtag / Short ID */}
                    <span className="text-sm font-extrabold text-blue-500 block mt-0.5">
                      #{item.id.substring(0, 8)}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => copyLink(item)}
                      className="w-8 h-8 rounded-lg bg-[#0b0f19] border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Copy Share Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => window.open(url, '_blank')}
                      className="w-8 h-8 rounded-lg bg-[#0b0f19] border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Open Link"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRecentItem(item.id)}
                      className="w-8 h-8 rounded-lg bg-[#0b0f19] border border-white/5 hover:bg-red-500/15 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                      title="Remove From Cache"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-white/5 mt-6">
              {pageNumbers.map((pageNum, idx) => {
                if (pageNum === '...') {
                  return (
                    <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs font-mono text-slate-500">
                      ...
                    </span>
                  );
                }
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 border border-blue-500 text-white shadow-md shadow-blue-500/10'
                        : 'border border-white/5 bg-white/2 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// -------------------------------------------------------------
// View: Download Page (Auth, Preview, Download)
// -------------------------------------------------------------
function DownloadView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [metadata, setMetadata] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [downloadingIndex, setDownloadingIndex] = useState(null);

  const [previewIndex, setPreviewIndex] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchMetadata();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [id]);

  useEffect(() => {
    if (!metadata) return;
    const timer = setInterval(() => {
      const diff = new Date(metadata.expiresAt) - new Date();
      if (diff <= 0) {
        clearInterval(timer);
        navigate('/expired');
        return;
      }
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [metadata]);

  const fetchMetadata = async (suppliedPassword = '') => {
    setLoading(true);
    setAuthError('');
    try {
      const response = await axios.post(`${getApiBase()}/file/${id}`, {
        password: suppliedPassword
      });
      setMetadata(response.data);
      setPasswordRequired(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setPasswordRequired(true);
        if (suppliedPassword) setAuthError('Incorrect Password');
      } else {
        navigate('/expired');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    fetchMetadata(password);
  };

  const downloadFile = async (index, filename) => {
    setDownloadingIndex(index);
    try {
      const response = await axios.post(
        `${getApiBase()}/download/${id}/${index}`,
        { password },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.showToast(`Downloaded: ${filename}`);

      if (metadata.oneTime) {
        toast.showToast("One-time packet read completed. Purging link...", "info");
        setTimeout(() => navigate('/expired'), 4000);
      } else {
        setTimeout(() => fetchMetadata(password), 1500);
      }
    } catch (err) {
      toast.showToast("Download failed", "error");
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handlePreview = async (index, mimetype) => {
    if (previewIndex === index) {
      setPreviewIndex(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    setLoadingPreview(true);
    setPreviewIndex(index);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    try {
      const response = await axios.post(
        `${getApiBase()}/download/${id}/${index}`,
        { password },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: mimetype });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewType(mimetype);
    } catch (e) {
      toast.showToast("Failed to preview file", "error");
      setPreviewIndex(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading && !metadata) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <span className="text-xs text-gray-500">Locating DropVault secure node...</span>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center text-center py-4"
      >
        <Lock className="w-8 h-8 text-blue-400 mb-3" />
        <h2 className="text-lg font-bold mb-1">Authenticated Key Required</h2>
        <p className="text-xs text-gray-500 mb-6">Enter password credentials to decrypt this packet.</p>

        <form onSubmit={handlePasswordSubmit} className="w-full space-y-3">
          <input
            type="password"
            placeholder="Security Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-center"
            required
          />
          {authError && <span className="text-[10px] text-red-400 block font-semibold">{authError}</span>}
          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 cursor-pointer text-white"
          >
            Authenticate Packet
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Expiry Header */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs font-mono">
        <span className="text-gray-500">Expiry Countdown:</span>
        <span className="text-blue-400 font-bold">{timeLeft || '00:00:00'}</span>
      </div>

      {/* Files List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {metadata.files.map((file, idx) => (
          <div key={idx} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between text-xs gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-200 truncate pr-2">{file.filename}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{formatSize(file.size)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Preview Trigger */}
                {(file.mimetype?.startsWith('image/') || 
                  file.mimetype?.startsWith('video/') || 
                  file.mimetype?.startsWith('audio/') || 
                  file.mimetype === 'application/pdf') && (
                  <button
                    onClick={() => handlePreview(idx, file.mimetype)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-lg"
                  >
                    {loadingPreview && previewIndex === idx ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                {/* Download Trigger */}
                <button
                  onClick={() => downloadFile(idx, file.filename)}
                  disabled={downloadingIndex !== null}
                  className="p-2 bg-blue-650/10 hover:bg-blue-650/20 text-blue-400 rounded-lg border border-blue-500/20"
                >
                  {downloadingIndex === idx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <DownloadIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Inline Preview Window */}
            {previewIndex === idx && previewUrl && (
              <div className="border-t border-white/5 p-3.5 bg-black/40 flex justify-center">
                {previewType.startsWith('image/') && (
                  <img src={previewUrl} alt="preview" className="max-h-[200px] w-auto rounded object-contain border border-white/5" />
                )}
                {previewType.startsWith('video/') && (
                  <video src={previewUrl} controls className="max-h-[200px] w-full rounded bg-black border border-white/5" />
                )}
                {previewType.startsWith('audio/') && (
                  <audio src={previewUrl} controls className="w-full" />
                )}
                {previewType === 'application/pdf' && (
                  <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-[250px] rounded border border-white/5" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {metadata.oneTime && (
        <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/10 rounded-xl text-[10px] text-red-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>This packet will be wiped instantly from the node after download.</span>
        </div>
      )}

      {/* Main Download All Action Button */}
      <button
        onClick={async () => {
          for (let i = 0; i < metadata.files.length; i++) {
            await downloadFile(i, metadata.files[i].filename);
          }
        }}
        disabled={downloadingIndex !== null}
        className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xl text-white hover:scale-[1.01] transition-transform"
      >
        <DownloadIcon className="w-4 h-4" />
        <span>Download Full Package</span>
      </button>
    </motion.div>
  );
}

// -------------------------------------------------------------
// View: Expired Error Fallback Page
// -------------------------------------------------------------
// View: Expired Error Fallback Page
function ExpiredView() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center py-6"
    >
      <ShieldAlert className="w-10 h-10 text-red-400 mb-4 animate-bounce" />
      <h2 className="text-xl font-bold mb-1">Packet Expired or Revoked</h2>
      <p className="text-xs text-gray-500 max-w-xs mb-8">
        This link has reached its lifetime limit, was designated one-time read, or has been revoked.
      </p>
      <button
        onClick={() => navigate('/')}
        className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 cursor-pointer"
      >
        Return to Upload
      </button>
    </motion.div>
  );
}
