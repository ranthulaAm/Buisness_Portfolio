import React, { useState, useRef, useEffect } from 'react';
import { SERVICES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Gift, Eye, ArrowRight, RefreshCw, Volume2, VolumeX, Check } from 'lucide-react';
import { getDisplayConfig, getLuckyWheelConfig } from '../services/dataService';
import { WheelSegment } from '../types';

interface OptionWheelProps {
  onSelectService?: (serviceId: string) => void;
}

export const OptionWheel: React.FC<OptionWheelProps> = ({ onSelectService }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'service' | 'discount'>('service');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [config, setConfig] = useState({ enableServiceWheel: true, enableDiscountWheel: true });
  const [discountSegments, setDiscountSegments] = useState<WheelSegment[]>([
    { id: 'd10', title: '10% OFF', promoCode: 'WHEEL10', color: '#6366f1', textColor: '#ffffff', description: 'Get a 10% discount on any design service order.', probability: 15 },
    { id: 'frev', title: 'Free Extra Revision', promoCode: 'WHEELREV', color: '#a855f7', textColor: '#ffffff', description: 'Get an extra round of revision for your design project.', probability: 15 },
    { id: 'd5', title: '5% OFF', promoCode: 'WHEEL5', color: '#ec4899', textColor: '#ffffff', description: 'Save 5% on your next order immediately.', probability: 15 },
    { id: 'mock', title: 'Free 3D Mockup', promoCode: 'WHEEL3D', color: '#f43f5e', textColor: '#ffffff', description: 'Receive an additional high-quality 3D visual showcase mockup.', probability: 10 },
    { id: 'd15', title: '15% OFF', promoCode: 'WHEEL15', color: '#ef4444', textColor: '#ffffff', description: 'Get a super 15% discount on your design service.', probability: 15 },
    { id: 'extra', title: 'Free Priority Support', promoCode: 'WHEELVIP', color: '#f97316', textColor: '#ffffff', description: 'Your order is bumped to high-priority status.', probability: 10 },
    { id: 'd20', title: 'MEGA 20% OFF', promoCode: 'WHEEL20', color: '#10b981', textColor: '#ffffff', description: 'Jackpot! Save a full 20% on your premium services.', probability: 10 },
    { id: 'd8', title: '8% OFF', promoCode: 'WHEEL8', color: '#06b6d4', textColor: '#ffffff', description: 'Save 8% on your selected project today.', probability: 10 },
  ]);

  const angleRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    getDisplayConfig().then(c => {
      setConfig({ 
        enableServiceWheel: c.enableServiceWheel !== false, 
        enableDiscountWheel: c.enableDiscountWheel !== false 
      });
      if (c.enableServiceWheel === false && c.enableDiscountWheel !== false) {
        setMode('discount');
      } else if (c.enableDiscountWheel === false && c.enableServiceWheel !== false) {
        setMode('service');
      }
    });

    getLuckyWheelConfig().then(segments => {
      setDiscountSegments(segments);
    });
  }, []);

  // Initialize Audio Context on user interaction to abide by browser autoplay policies
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.03);
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (e) {
      // Audio autoplay blocked or failed
    }
  };

  // Define segments based on standard 8 items
  const serviceSegments: WheelSegment[] = SERVICES.map((s, idx) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    color: [
      '#6366f1', // Indigo
      '#a855f7', // Purple
      '#ec4899', // Pink
      '#f43f5e', // Rose
      '#ef4444', // Red
      '#f97316', // Orange
      '#10b981', // Emerald
      '#06b6d4', // Cyan
    ][idx % 8],
    textColor: '#ffffff',
  }));

  const currentSegments = mode === 'service' ? serviceSegments : discountSegments;

  const handleSpin = () => {
    if (isSpinning) return;
    
    initAudio();
    setIsSpinning(true);
    setResultIndex(null);
    setCopiedCode(false);

    const duration = 4000; // 4 seconds spin
    const startAngle = angleRef.current;
    
    // Choose random landing index (0 to 7) using probability if available
    let targetIdx = Math.floor(Math.random() * 8);
    
    // Calculate total probability
    const totalProb = currentSegments.reduce((sum, seg) => sum + (Number(seg.probability) || 1), 0);
    let rand = Math.random() * totalProb;
    let accumulatedProb = 0;
    
    for (let i = 0; i < currentSegments.length; i++) {
      accumulatedProb += (Number(currentSegments[i].probability) || 1);
      if (rand <= accumulatedProb) {
        targetIdx = i;
        break;
      }
    }
    
    // Calculate final angle
    // Each segment is 45 degrees.
    // To land segment targetIdx at the top (0 degrees / 12 o'clock pointer),
    // we rotate counter-clockwise by targetIdx * 45.
    // We add multiple complete rotations (5 to 8) to make it spin fast.
    const extraRotations = 6 + Math.random() * 2;
    const finalAngle = startAngle + extraRotations * 360 + (360 - targetIdx * 45);
    
    const startTime = performance.now();
    let lastTickSegment = -1;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      
      if (elapsed >= duration) {
        const finalNormalizedAngle = finalAngle % 360;
        angleRef.current = finalAngle;
        setCurrentAngle(finalNormalizedAngle);
        setIsSpinning(false);
        setResultIndex(targetIdx);
        return;
      }

      // Smooth deceleration using cubic easeOut
      const t = elapsed / duration;
      const easeT = 1 - Math.pow(1 - t, 4); // Quartic ease out
      const angle = startAngle + (finalAngle - startAngle) * easeT;
      
      angleRef.current = angle;
      setCurrentAngle(angle % 360);

      // Trigger ticker sound when crossing segment boundaries
      const currentSegment = Math.floor(((angle % 360) + 22.5) / 45) % 8;
      if (currentSegment !== lastTickSegment) {
        playTickSound();
        lastTickSegment = currentSegment;
      }

      requestAnimationFrame(animateSpin);
    };

    requestAnimationFrame(animateSpin);
  };

  const selectedResult = resultIndex !== null ? currentSegments[resultIndex] : null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleBookResult = () => {
    if (!selectedResult) return;
    if (mode === 'service') {
      if (onSelectService) {
        onSelectService(selectedResult.id);
      } else {
        navigate(`/order?service=${selectedResult.id}`);
      }
    } else {
      // In discount mode, save coupon in sessionStorage so Order.tsx can auto-apply it!
      if (selectedResult.promoCode) {
        sessionStorage.setItem('active_promo_code', selectedResult.promoCode);
        sessionStorage.setItem('active_promo_discount', selectedResult.title);
      }
      navigate('/order');
    }
  };

  // SVG parameters
  const cx = 200;
  const cy = 200;
  const r = 180;

  if (!config.enableServiceWheel && !config.enableDiscountWheel) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Mode Switches */}
      {(config.enableServiceWheel && config.enableDiscountWheel) && (
        <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 mb-8 max-w-sm w-full">
          <button
            onClick={() => { if (!isSpinning) { setMode('service'); setResultIndex(null); } }}
            disabled={isSpinning}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              mode === 'service'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Sparkles size={14} />
            <span>Service Picker</span>
          </button>
          <button
            onClick={() => { if (!isSpinning) { setMode('discount'); setResultIndex(null); } }}
            disabled={isSpinning}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              mode === 'discount'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
            }`}
          >
            <Gift size={14} />
            <span>Lucky Wheel</span>
          </button>
        </div>
      )}

      {/* Main Wheel Area */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-5xl px-4 py-6">
        
        {/* The Interactive Wheel Graphic */}
        <div className="relative w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] shrink-0">
          
          {/* Outer Ring & Glow Effects */}
          <div className="absolute inset-[-12px] bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full blur-lg opacity-25 dark:opacity-30"></div>
          
          <div className="absolute inset-[-6px] border-4 border-slate-900 dark:border-slate-700 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-gradient-to-b from-slate-800 to-slate-900"></div>

          {/* Wheel SVG */}
          <div 
            className="w-full h-full relative z-10 select-none overflow-hidden rounded-full"
            style={{
              transform: `rotate(${currentAngle}deg)`,
              transition: isSpinning ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <g>
                {currentSegments.map((segment, idx) => {
                  // Drawing pie slices using SVG Paths
                  const startDeg = idx * 45 - 112.5;
                  const endDeg = (idx + 1) * 45 - 112.5;
                  const startRad = (startDeg * Math.PI) / 180;
                  const endRad = (endDeg * Math.PI) / 180;

                  const x1 = cx + r * Math.cos(startRad);
                  const y1 = cy + r * Math.sin(startRad);
                  const x2 = cx + r * Math.cos(endRad);
                  const y2 = cy + r * Math.sin(endRad);

                  return (
                    <g key={segment.id} className="cursor-pointer">
                      {/* Slices */}
                      <path
                        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                        fill={segment.color}
                        stroke="#1e293b"
                        strokeWidth="1.5"
                        opacity={resultIndex !== null && resultIndex !== idx ? 0.3 : 0.95}
                        className="transition-opacity duration-500"
                      />
                      
                      {/* Radial Text & Indicators */}
                      <g 
                        transform={`rotate(${idx * 45 - 90}, ${cx}, ${cy}) translate(${cx + 85}, ${cy})`}
                        opacity={resultIndex !== null && resultIndex !== idx ? 0.4 : 1}
                        className="transition-opacity duration-500"
                      >
                        <text
                          x="0"
                          y="4"
                          fill={segment.textColor}
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="start"
                          letterSpacing="0.05em"
                          transform="rotate(0)"
                          className="font-sans uppercase"
                          style={{
                            maxWidth: '75px',
                            wordWrap: 'break-word'
                          }}
                        >
                          {segment.title.length > 14 ? `${segment.title.substring(0, 12)}..` : segment.title}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* Central Metallic Cap */}
              <circle cx={cx} cy={cy} r="35" className="fill-slate-900 stroke-slate-700 stroke-2 shadow-2xl" />
              <circle cx={cx} cy={cy} r="30" className="fill-slate-800" />
            </svg>
          </div>

          {/* Central Spin Button & Interactive Pointer */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex flex-col items-center justify-center border-4 border-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(147,51,234,0.7)] hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all cursor-pointer select-none"
          >
            <span className="text-[10px] font-black tracking-wider uppercase leading-none">SPIN</span>
          </button>

          {/* Pointer Pin at 12 o'clock */}
          <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
            <div className="w-6 h-6 bg-rose-500 rotate-45 rounded-tl-full rounded-br-sm border-2 border-slate-900 dark:border-white shadow-lg"></div>
            <div className="-mt-3 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Results / Information Panel */}
        <div className="flex-1 min-w-[240px] md:min-w-[340px] w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 rounded-[2rem] p-6 md:p-8 flex flex-col relative overflow-hidden backdrop-blur-md">
          {/* Sounds Toggle */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-2 rounded-full transition-colors"
            title={soundEnabled ? "Mute clicks" : "Enable clicks"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {!isSpinning && !selectedResult ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 animate-pulse">
                {mode === 'service' ? <Sparkles size={28} /> : <Gift size={28} />}
              </div>
              <h3 className="text-xl font-display font-bold text-gray-900 dark:text-slate-100 mb-3">
                {mode === 'service' ? 'Service Selector Wheel' : 'Lucky Discount Wheel'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
                {mode === 'service' 
                  ? 'Unsure which service fits your brand? Click the SPIN button to let destiny pick the perfect service for your creative project!' 
                  : 'Feeling lucky? Spin the wheel to unlock exclusive custom discounts, free add-ons, or priority delivery at checkout!'}
              </p>
              <button
                onClick={handleSpin}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Spin Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : isSpinning ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <RefreshCw size={44} className="text-purple-600 dark:text-purple-400 animate-spin mb-6" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 animate-pulse">
                Destiny is rotating...
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                Decelerating onto your selected slot
              </p>
            </div>
          ) : (
            selectedResult && (
              <div className="flex flex-col h-full animate-fade-in">
                <span className="text-[10px] font-mono tracking-widest text-purple-600 dark:text-purple-400 uppercase font-black mb-1">
                  Your Spin Result
                </span>
                
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <span>{selectedResult.title}</span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedResult.color }}></div>
                </h3>

                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
                  {selectedResult.description}
                </p>

                {/* Promo Code section for Lucky Wheel */}
                {mode === 'discount' && selectedResult.promoCode && (
                  <div className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">PROMO CODE</span>
                      <span className="text-lg font-mono font-black text-purple-600 dark:text-purple-400">{selectedResult.promoCode}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(selectedResult.promoCode!)}
                      className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-950/70 border border-purple-200 dark:border-purple-900/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 text-purple-600 dark:text-purple-400"
                    >
                      {copiedCode ? (
                        <>
                          <Check size={14} className="text-green-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <span>Copy Code</span>
                      )}
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <button
                    onClick={handleBookResult}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20"
                  >
                    <span>{mode === 'service' ? 'Order This Service' : 'Claim & Order Now'}</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={handleSpin}
                    className="border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700/50 py-3 px-5 rounded-2xl text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} />
                    <span>Spin Again</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
