/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

// URL do sistema LaFome
const SYSTEM_URL = "http://192.168.1.104/LaFome/index.php";

// Componente para as partículas de comida explodindo
const FoodParticles = () => {
  const foods = ['🍕', '🍔', '🍟', '🌭', '🌮', '🥗', '🍱', '🍦', '🍩', '🍎'];
  const particles = Array.from({ length: 15 }); // 15 partículas para não poluir

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => {
        const food = foods[Math.floor(Math.random() * foods.length)];
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const distance = 100 + Math.random() * 200;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ 
              x: x, 
              y: y, 
              opacity: [0, 1, 0], 
              scale: [0, 1, 0.5],
              rotate: Math.random() * 360 
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
            className="absolute left-1/2 top-1/2 text-xl"
          >
            {food}
          </motion.div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | 'offline' | 'load_error'>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Verificar conexão inicial e monitorar mudanças
  useEffect(() => {
    const checkConnection = () => {
      if (!navigator.onLine) {
        setError('offline');
      } else {
        if (error === 'offline') setError(null);
      }
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();

    // Simular tempo de splash screen (estilo iFood)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4500); // Aumentado um pouco para apreciar a animação

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearTimeout(timer);
    };
  }, [error]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    setIframeLoaded(false);
    if (iframeRef.current) {
      iframeRef.current.src = SYSTEM_URL;
    }
  };

  // Tentar detectar erro de carregamento de forma mais agressiva
  useEffect(() => {
    if (!loading && !iframeLoaded && !error) {
      // Verificação via fetch para detectar "Connection Refused" rapidamente
      const checkConnection = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          await fetch(SYSTEM_URL, { 
            mode: 'no-cors', 
            cache: 'no-store',
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
        } catch (e) {
          // Silenciamos o log de erro no console para não confundir o usuário, 
          // já que a falha de conexão é tratada pela interface personalizada.
          setError('load_error');
        }
      };

      checkConnection();

      // Fallback de timeout caso o fetch não pegue (ex: carregamento infinito)
      const timeout = setTimeout(() => {
        if (!iframeLoaded) {
          setError('load_error');
        }
      }, 12000); 
      
      return () => clearTimeout(timeout);
    }
  }, [loading, iframeLoaded, error]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {/* Splash Screen - Estilo iFood com Heartbeat e Explosão de Comida */}
        {loading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#004d26]" // Verde escuro LaFome
          >
            {/* Background Explosions */}
            <FoodParticles />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1, 1.15, 1], // Batida de coração (duplo pulso)
                opacity: 1 
              }}
              transition={{ 
                scale: {
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                opacity: { duration: 0.8 }
              }}
              className="relative z-10"
            >
              <div className="w-80 h-80 flex flex-col items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="LaFome Logo"
                  className="w-full h-auto drop-shadow-[0_0_50px_rgba(50,205,50,0.5)]"
                  onError={(e) => {
                    // Se a imagem falhar, não mostramos nada para não poluir
                    (e.target as HTMLImageElement).style.opacity = '0';
                  }}
                />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-12"
            >
              <div className="w-8 h-8 border-4 border-[#32cd32]/20 border-t-[#32cd32] rounded-full animate-spin" />
            </motion.div>
          </motion.div>
        )}

        {/* Erro de Conexão (Offline) */}
        {!loading && error === 'offline' && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center"
          >
            <div className="w-24 h-24 bg-[#ff3b30]/10 rounded-full flex items-center justify-center mb-6 border border-[#ff3b30]/20">
              <WifiOff size={48} className="text-[#ff3b30]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Sem Conexão</h2>
            <p className="text-gray-400 max-w-xs mb-8 leading-relaxed">
              Parece que você está offline. Verifique sua internet para continuar matando sua fome!
            </p>
            <button
              onClick={handleRetry}
              className="px-10 py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-wider"
            >
              <RefreshCw size={20} />
              Tentar Novamente
            </button>
          </motion.div>
        )}

        {/* Erro de Carregamento (Servidor fora ou IP inacessível) - DESIGN FUTURISTA VERDE E OURO */}
        {!loading && error === 'load_error' && (
          <motion.div
            key="load_error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#001408] p-6 text-center overflow-hidden"
          >
            {/* Elementos Decorativos Futuristas */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#32cd32]/10 via-transparent to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-[#ffd700]/10 rounded-full animate-[pulse_4s_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-[#32cd32]/20 rounded-full animate-[pulse_2s_infinite]" />
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(50,205,50,0.06),rgba(255,215,0,0.02),rgba(50,205,50,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
            </div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative mb-10">
                <div className="w-28 h-28 bg-[#32cd32]/10 rounded-3xl rotate-45 flex items-center justify-center border border-[#ffd700]/30 backdrop-blur-md shadow-[0_0_50px_rgba(50,205,50,0.2)]">
                  <AlertCircle size={56} className="text-[#ffd700] -rotate-45 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#ffd700] text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">
                  ERRO NO SISTEMA
                </div>
              </div>

              <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
                SISTEMA <span className="text-[#32cd32] drop-shadow-[0_0_15px_rgba(50,205,50,0.6)]">OFFLINE</span>
              </h2>
              
              <div className="h-1 w-20 bg-[#ffd700] mb-6 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />

              <p className="text-white/90 max-w-sm mb-2 font-bold text-lg leading-tight">
                Não foi possível estabelecer conexão com a central LaFome.
              </p>
              
              <p className="text-white/60 max-w-xs mb-10 text-sm font-medium leading-relaxed">
                O servidor pode estar em manutenção. Por favor, entre em contato com nossa equipe técnica.
              </p>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  onClick={handleRetry}
                  className="group relative px-8 py-4 overflow-hidden rounded-xl bg-[#32cd32] text-white font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(50,205,50,0.3)]"
                >
                  <span className="relative flex items-center justify-center gap-3">
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                    Recarregar App
                  </span>
                </button>

                <a 
                  href="https://wa.me/55991548986?text=Olá%20Equipe%20-%20LaFome,%20estou%20com%20problemas%20para%20acessar%20o%20app."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 rounded-xl border border-[#ffd700]/30 text-[#ffd700] font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#ffd700]/10 hover:text-[#ffd700] transition-all flex items-center justify-center gap-2"
                >
                  Contatar Suporte
                </a>
              </div>
            </motion.div>

            <div className="absolute bottom-8 left-0 right-0 text-[#ffd700]/20 text-[10px] font-mono uppercase tracking-[0.5em] pointer-events-none">
              Protocol: LF-SECURE-CONNECT-FAIL // 0x88291
            </div>
          </motion.div>
        )}

        {/* Webview (Iframe) */}
        {!loading && !error && (
          <motion.div
            key="webview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full bg-white"
          >
            <iframe
              ref={iframeRef}
              src={SYSTEM_URL}
              className="w-full h-full border-none"
              onLoad={handleIframeLoad}
              title="LaFome Web System"
              allow="geolocation; microphone; camera"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
