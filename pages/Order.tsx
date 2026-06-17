import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Upload, Check, ChevronRight, Palette, Plus, X, ArrowLeft, AlertCircle, Home as HomeIcon, ShieldCheck, Mic, Square, Play, Trash2, PlusCircle, MinusCircle, Monitor, Smartphone, Printer, Layers, Move, Maximize, CreditCard, BookOpen, FileText, ImageIcon, Video, Facebook, Linkedin, Youtube, Instagram, Twitter, Loader } from 'lucide-react';
import { SERVICES as DEFAULT_SERVICES } from '../constants';
import { User } from '../types';
import { saveOrder, updateOrder, getOrderById, generateOrderId } from '../services/storageService';
import { uploadFile } from '../services/fileUploadService';
import { sendConfirmationEmail } from '../services/emailService';
import { sendTelegramNotification } from '../services/telegramService';
import { OrderStatus } from '../types';
import { getServicesConfig, getDiscountsConfig } from '../services/dataService';
import { OfferBanner } from '../components/OfferBanner';

interface OrderProps {
  user: User | null;
  onLoginRequest: () => void;
}

// --- INDUSTRY STANDARD PRESETS ---
const SERVICE_PRESETS: Record<string, any[]> = {
  s_social: [
    { id: 'ig_sq', name: 'Instagram Square', width: '1080', height: '1080', unit: 'px', ppi: '72', icon: Instagram },
    { id: 'ig_pt', name: 'Instagram Portrait', width: '1080', height: '1350', unit: 'px', ppi: '72', icon: Instagram },
    { id: 'ig_st', name: 'Story / Reel / TikTok', width: '1080', height: '1920', unit: 'px', ppi: '72', icon: Smartphone },
    { id: 'fb_pt', name: 'Facebook Post', width: '1200', height: '630', unit: 'px', ppi: '72', icon: Facebook },
    { id: 'fb_cv', name: 'Facebook Cover', width: '820', height: '312', unit: 'px', ppi: '72', icon: Facebook },
    { id: 'yt_th', name: 'YouTube Thumbnail', width: '1280', height: '720', unit: 'px', ppi: '72', icon: Youtube },
    { id: 'li_cv', name: 'LinkedIn Banner', width: '1584', height: '396', unit: 'px', ppi: '72', icon: Linkedin },
    { id: 'tw_hd', name: 'X / Twitter Header', width: '1500', height: '500', unit: 'px', ppi: '72', icon: Twitter },
    { id: 'pin_lg', name: 'Pinterest Pin', width: '1000', height: '1500', unit: 'px', ppi: '72', icon: ImageIcon },
  ],
  s_invite: [
    { id: 'inv_57', name: 'Standard 5x7"', width: '5', height: '7', unit: 'in', ppi: '300', icon: Printer },
    { id: 'inv_46', name: 'Classic 4x6"', width: '4', height: '6', unit: 'in', ppi: '300', icon: Printer },
    { id: 'inv_sq', name: 'Square 5.25"', width: '5.25', height: '5.25', unit: 'in', ppi: '300', icon: Printer },
    { id: 'inv_a5', name: 'A5 Invitation', width: '148', height: '210', unit: 'mm', ppi: '300', icon: Printer },
    { id: 'inv_dl', name: 'DL Card', width: '99', height: '210', unit: 'mm', ppi: '300', icon: Printer },
    { id: 'evite', name: 'Digital Evite (HD)', width: '1080', height: '1920', unit: 'px', ppi: '72', icon: Smartphone },
  ],
  s_banner: [
    { id: 'ban_web_l', name: 'Leaderboard', width: '728', height: '90', unit: 'px', ppi: '72', icon: Monitor },
    { id: 'ban_web_m', name: 'Medium Rect', width: '300', height: '250', unit: 'px', ppi: '72', icon: Monitor },
    { id: 'ban_web_s', name: 'Skyscraper', width: '160', height: '600', unit: 'px', ppi: '72', icon: Monitor },
    { id: 'ban_roll', name: 'Roll-up Standee', width: '850', height: '2000', unit: 'mm', ppi: '150', icon: Layers },
    { id: 'ban_fb_ev', name: 'FB Event Cover', width: '1920', height: '1005', unit: 'px', ppi: '72', icon: Facebook },
    { id: 'ban_yt_ch', name: 'YouTube Channel', width: '2560', height: '1440', unit: 'px', ppi: '72', icon: Youtube },
  ],
  s_flyer: [
    { id: 'fly_a4', name: 'A4 Standard', width: '210', height: '297', unit: 'mm', ppi: '300', icon: FileText },
    { id: 'fly_a5', name: 'A5 Half Page', width: '148', height: '210', unit: 'mm', ppi: '300', icon: FileText },
    { id: 'fly_a6', name: 'A6 Postcard', width: '105', height: '148', unit: 'mm', ppi: '300', icon: FileText },
    { id: 'fly_dl', name: 'DL Rack Card', width: '99', height: '210', unit: 'mm', ppi: '300', icon: FileText },
    { id: 'fly_us', name: 'US Letter', width: '8.5', height: '11', unit: 'in', ppi: '300', icon: FileText },
    { id: 'fly_dig', name: 'Digital Flyer', width: '1080', height: '1350', unit: 'px', ppi: '72', icon: Smartphone },
  ],
  s_tute: [
    { id: 'tut_a4', name: 'A4 Document', width: '210', height: '297', unit: 'mm', ppi: '300', icon: BookOpen },
    { id: 'tut_us', name: 'US Letter', width: '8.5', height: '11', unit: 'in', ppi: '300', icon: BookOpen },
    { id: 'tut_scr', name: 'Presentation (16:9)', width: '1920', height: '1080', unit: 'px', ppi: '72', icon: Monitor },
    { id: 'tut_tb', name: 'Tabloid (11x17)', width: '11', height: '17', unit: 'in', ppi: '300', icon: Printer },
  ],
  s_letterhead: [
    { id: 'lh_a4', name: 'A4 Letterhead', width: '210', height: '297', unit: 'mm', ppi: '300', icon: FileText },
    { id: 'lh_us', name: 'US Letter', width: '8.5', height: '11', unit: 'in', ppi: '300', icon: FileText },
    { id: 'lh_dig', name: 'Email Header', width: '600', height: '200', unit: 'px', ppi: '72', icon: Monitor },
  ],
  s_book: [
    { id: 'bk_kind', name: 'Kindle / Ebook', width: '1600', height: '2560', unit: 'px', ppi: '72', icon: Smartphone },
    { id: 'bk_aud', name: 'Audiobook', width: '2400', height: '2400', unit: 'px', ppi: '72', icon: Smartphone },
    { id: 'bk_69', name: 'Trade Paperback (6x9)', width: '6', height: '9', unit: 'in', ppi: '300', icon: BookOpen },
    { id: 'bk_58', name: 'Novel Standard (5x8)', width: '5', height: '8', unit: 'in', ppi: '300', icon: BookOpen },
    { id: 'bk_sq', name: 'Square Book', width: '8.5', height: '8.5', unit: 'in', ppi: '300', icon: BookOpen },
  ],
  s_businesscard: [
    { id: 'bc_us', name: 'US Standard', width: '3.5', height: '2', unit: 'in', ppi: '300', icon: CreditCard },
    { id: 'bc_eu', name: 'EU Standard', width: '85', height: '55', unit: 'mm', ppi: '300', icon: CreditCard },
    { id: 'bc_sq', name: 'Square', width: '2.5', height: '2.5', unit: 'in', ppi: '300', icon: CreditCard },
    { id: 'bc_vert', name: 'Vertical US', width: '2', height: '3.5', unit: 'in', ppi: '300', icon: CreditCard },
  ],
};

// ... [Color Utils] ...
const rgbToCmyk = (r: number, g: number, b: number) => {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
};

const PhotoshopColorPicker: React.FC<{ color: string; onChange: (hex: string) => void; onAdd: (hex: string) => void; isPrintMode: boolean; canAdd: boolean; }> = ({ color, onChange, onAdd, isPrintMode, canAdd }) => {
  const [h, setH] = useState(0);
  const [s, setS] = useState(100);
  const [v, setV] = useState(100);
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const hsvToHex = (h: number, s: number, v: number) => {
    const s_val = s / 100;
    const v_val = v / 100;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v_val * (1 - s_val);
    const q = v_val * (1 - f * s_val);
    const t = v_val * (1 - (1 - f) * s_val);
    let r = 0, g = 0, b = 0;
    switch (i % 6) { case 0: r = v_val; g = t; b = p; break; case 1: r = q; g = v_val; b = p; break; case 2: r = p; g = v_val; b = t; break; case 3: r = p; g = q; b = v_val; break; case 4: r = t; g = p; b = v_val; break; case 5: r = v_val; g = p; b = q; break; }
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const updateSV = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const newS = Math.round((x / rect.width) * 100);
    const newV = Math.round(100 - (y / rect.height) * 100);
    setS(newS);
    setV(newV);
    onChange(hsvToHex(h, newS, newV));
  }, [h, onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = `hsl(${h}, 100%, 50%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const whiteGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    whiteGrad.addColorStop(0, 'white');
    whiteGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const blackGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    blackGrad.addColorStop(0, 'transparent');
    blackGrad.addColorStop(1, 'black');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [h]);

  useEffect(() => {
    if (!isDraggingSV) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      updateSV(clientX, clientY);
    };
    const onUp = () => setIsDraggingSV(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [isDraggingSV, updateSV]);

  const rgb = hexToRgb(color);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-5 rounded-[2.5rem] shadow-sm w-full max-w-sm animate-fade-in h-fit">
      <div className="flex gap-4 h-48 mb-5">
        <div className="relative flex-1">
          <canvas ref={canvasRef} width={220} height={220} className="w-full h-full rounded-2xl cursor-crosshair border border-gray-200 dark:border-slate-700 touch-none" onMouseDown={(e) => { setIsDraggingSV(true); updateSV(e.clientX, e.clientY); }} onTouchStart={(e) => { setIsDraggingSV(true); updateSV(e.touches[0].clientX, e.touches[0].clientY); }} />
          <div className="absolute w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ left: `${s}%`, top: `${100 - v}%`, backgroundColor: color }} />
        </div>
        <div className="w-8 h-full relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
          <input type="range" min="0" max="360" value={h} onChange={(e) => { const newH = parseInt(e.target.value); setH(newH); onChange(hsvToHex(newH, s, v)); }} className="absolute top-0 left-0 w-48 h-8 origin-top-left rotate-90 translate-x-8 cursor-pointer appearance-none bg-transparent opacity-0 z-10" />
          <div className="absolute w-full h-2 border-y border-white dark:border-slate-800 shadow-md pointer-events-none" style={{ top: `${(h / 360) * 100}%` }} />
        </div>
      </div>
      <div className="bg-gray-55 p-4 rounded-2xl border border-gray-150 mb-5">
        <div className="flex items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-slate-700 shadow-inner" style={{ backgroundColor: color }}></div>
            <div className="text-left">
              <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isPrintMode ? 'text-orange-500' : 'text-purple-600'}`}>{isPrintMode ? 'Print (CMYK)' : 'Web (RGB)'}</div>
              <div className="text-gray-900 dark:text-slate-100 font-mono text-sm font-bold uppercase tracking-wider">{color}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono text-gray-500 dark:text-slate-400 border-l border-gray-200 dark:border-slate-700 pl-5">
            {isPrintMode ? (<><div>C:{cmyk.c}%</div><div>M:{cmyk.m}%</div><div>Y:{cmyk.y}%</div><div>K:{cmyk.k}%</div></>) : (<><div>R:{rgb.r}</div><div>G:{rgb.g}</div><div>B:{rgb.b}</div><div className="opacity-0">.</div></>)}
          </div>
        </div>
        <button type="button" disabled={!canAdd} onClick={() => onAdd(color)} className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${canAdd ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'}`}>
          {canAdd ? <><Plus size={14} /> Add to Palette</> : 'Palette Full'}
        </button>
      </div>
    </div>
  );
};

export const Order: React.FC<OrderProps> = ({ user, onLoginRequest }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const step = parseInt(searchParams.get('step') || '1', 10);
  const preSelectedServiceId = searchParams.get('service');
  const editOrderId = searchParams.get('edit');
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, any>>({});
  const [globalDiscountConfig, setGlobalDiscountConfig] = useState({ globalDiscount: 0, isActive: false });

  useEffect(() => {
    getServicesConfig().then(configs => {
      setServiceConfigs(configs);
      let baseServices = [...DEFAULT_SERVICES];
      
      // Add custom ones from configs that aren't in SERVICES
      Object.keys(configs).forEach(key => {
         const c = configs[key];
         if (c.isCustom && !baseServices.find(b => b.id === c.id)) {
            baseServices.push({
               id: c.id,
               title: c.title || 'Custom Service',
               description: c.description || '',
               image: c.image || 'https://picsum.photos/600/800?random=999',
               features: c.features || [],
               price: c.price,
            });
         }
      });
      
      if (Object.keys(configs).length > 0) {
        setServices(baseServices.map(s => {
           if (configs[s.id]) {
              if (configs[s.id].isCustom) {
                  return { ...s, price: configs[s.id].price, title: configs[s.id].title || s.title, description: configs[s.id].description || s.description, image: configs[s.id].image || s.image, features: configs[s.id].features || s.features };
              }
              return { ...s, price: configs[s.id].price };
           }
           return s;
        }));
      } else {
        setServices(baseServices);
      }
    }).catch(console.error);
    
    getDiscountsConfig().then(config => {
        setGlobalDiscountConfig(config);
    }).catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: '',
    serviceType: preSelectedServiceId || DEFAULT_SERVICES[0].id,
    industry: '',
    requirements: '',
    colorPalette: [] as string[],
    files: [] as File[],
    voiceClips: [] as { blob: Blob, url: string, name: string }[],
    // Dynamic Fields
    eventTitle: '',
    brandName: '',
    socialLinks: [{ platform: 'WhatsApp', handle: '' }],
    websiteUrl: '',
    audience: '',
    venue: '',
    eventDate: '',
    eventTime: '',
    recipient: '',
    subject: '',
    unitName: '',
    tutorName: '',
    year: '',
    institutes: '',
    keywords: '',
    motto: '',
    location: '',
    telephones: [''],
    books: [{ title: '', author: '' }],
    extraDetails: '',
    // Technical Specs
    dimensions: {
      width: '1080',
      height: '1080',
      unit: 'px',
      ppi: '72',
      orientation: 'square' as 'portrait' | 'landscape' | 'square',
      aspectRatio: '1:1'
    }
  });

  const [countryCode, setCountryCode] = useState('+94');
  const [phoneInput, setPhoneInput] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [customColor, setCustomColor] = useState('#ff007f');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Sync mobile when parts change
  useEffect(() => {
    setFormData(prev => ({ ...prev, mobile: `${countryCode}${phoneInput}` }));
  }, [countryCode, phoneInput]);

  // Load existing order if in Edit mode
  useEffect(() => {
    const loadOrder = async () => {
      if (editOrderId) {
        const orderToEdit = await getOrderById(editOrderId);
        if (orderToEdit) {
          setFormData(prev => ({
            ...prev,
            name: orderToEdit.clientName,
            email: orderToEdit.email,
            mobile: orderToEdit.mobile,
            serviceType: orderToEdit.serviceId || 's_social', 
            industry: orderToEdit.industry,
            requirements: orderToEdit.requirements,
            keywords: orderToEdit.keywords,
            colorPalette: orderToEdit.colorPalette,
            dimensions: orderToEdit.dimensions || prev.dimensions,
            files: [], // Files cannot be restored in edit mode in this demo version
          }));
          
          // Attempt to parse mobile number
          const mob = orderToEdit.mobile;
          if (mob.startsWith('+94')) { setCountryCode('+94'); setPhoneInput(mob.replace('+94', '')); }
          else if (mob.startsWith('+1')) { setCountryCode('+1'); setPhoneInput(mob.replace('+1', '')); }
          else if (mob.startsWith('+44')) { setCountryCode('+44'); setPhoneInput(mob.replace('+44', '')); }
          else if (mob.startsWith('+61')) { setCountryCode('+61'); setPhoneInput(mob.replace('+61', '')); }
          else if (mob.startsWith('+91')) { setCountryCode('+91'); setPhoneInput(mob.replace('+91', '')); }
          else if (mob.startsWith('+971')) { setCountryCode('+971'); setPhoneInput(mob.replace('+971', '')); }
          else { setCountryCode(''); setPhoneInput(mob); }
        }
      }
    };
    loadOrder();
  }, [editOrderId]);

  const isPrintMode = ['s_invite', 's_banner', 's_tute', 's_letterhead', 's_book', 's_businesscard'].includes(formData.serviceType);
  const selectedServiceTitle = services.find(s => s.id === formData.serviceType)?.title || 'New Project';

  useEffect(() => {
    if (user) setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
  }, [user]);

  useEffect(() => {
    if (formRef.current) {
      const yOffset = -100;
      const y = formRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [step, formData.serviceType]);

  const currentPresets = SERVICE_PRESETS[formData.serviceType] || [];

  const validateStep = (currentStep: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Full Name is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) newErrors.email = 'Email Address is required';
      else if (!emailRegex.test(formData.email)) newErrors.email = 'Enter a valid email address';
      if (!formData.mobile.trim() || formData.mobile.length < 5) newErrors.mobile = 'Phone number is required';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (formRef.current) {
        const yOffset = -100;
        const y = formRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return false;
    }
    return true;
  };

  const handleNextStep = () => validateStep(step) && changeStep(step + 1);

  const changeStep = (newStep: number) => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('step', newStep.toString());
      setSearchParams(nextParams);
      setIsExiting(false);
    }, 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'mobile') return; 

    if (name === 'serviceType') {
      const isPrint = ['s_invite', 's_banner', 's_tute', 's_letterhead', 's_book', 's_businesscard'].includes(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: finalValue,
        dimensions: { ...prev.dimensions, ppi: isPrint ? '300' : '72', unit: isPrint ? 'mm' : 'px' }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleDimensionChange = (field: string, value: string) => {
    setFormData(prev => {
      const newDims = { ...prev.dimensions, [field]: value };
      if (field === 'width' || field === 'height') {
        const w = parseFloat(newDims.width) || 0;
        const h = parseFloat(newDims.height) || 0;
        if (w > h) newDims.orientation = 'landscape';
        else if (h > w) newDims.orientation = 'portrait';
        else newDims.orientation = 'square';
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const common = gcd(Math.round(w), Math.round(h));
        newDims.aspectRatio = common > 0 ? `${Math.round(w/common)}:${Math.round(h/common)}` : 'Custom';
      }
      return { ...prev, dimensions: newDims };
    });
  };

  const applyPreset = (presetId: string) => {
    const p = currentPresets.find(x => x.id === presetId);
    if (p) {
      const w = parseFloat(p.width);
      const h = parseFloat(p.height);
      setFormData(prev => ({
        ...prev,
        dimensions: { ...prev.dimensions, width: p.width, height: p.height, unit: p.unit, ppi: p.ppi, orientation: w > h ? 'landscape' : h > w ? 'portrait' : 'square', aspectRatio: `${p.width}:${p.height}` }
      }));
    }
  };

  const toggleOrientation = () => {
    setFormData(prev => {
      const { width, height, orientation } = prev.dimensions;
      return { ...prev, dimensions: { ...prev.dimensions, width: height, height: width, orientation: orientation === 'portrait' ? 'landscape' : 'portrait' } };
    });
  };

  const updateList = (field: 'socialLinks' | 'telephones' | 'books', index: number, subField: string, value: string) => {
    setFormData(prev => {
      const list = [...(prev[field] as any[])];
      let finalValue = value;
      if (field === 'telephones') finalValue = value.replace(/[^0-9]/g, '');
      if (typeof list[index] === 'object') list[index] = { ...list[index], [subField]: finalValue };
      else list[index] = finalValue;
      return { ...prev, [field]: list };
    });
  };

  const addItem = (field: 'socialLinks' | 'telephones' | 'books', template: any) => { setFormData(prev => ({ ...prev, [field]: [...(prev[field] as any[]), template] })); };
  const removeItem = (field: 'socialLinks' | 'telephones' | 'books', index: number) => { setFormData(prev => ({ ...prev, [field]: (prev[field] as any[]).filter((_, i) => i !== index) })); };
  const removeVoiceClip = (index: number) => {
    setFormData(prev => {
      const clip = prev.voiceClips[index];
      if (clip && clip.url) URL.revokeObjectURL(clip.url);
      return { ...prev, voiceClips: prev.voiceClips.filter((_, i) => i !== index) };
    });
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setFormData(prev => ({ ...prev, voiceClips: [...prev.voiceClips, { blob, url, name: `Voice Note ${prev.voiceClips.length + 1}` }] }));
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert('Microphone access denied.'); }
  };

  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) { handleNextStep(); return; }
    if (isSubmitting || !user) { if (!user) onLoginRequest(); return; }
    setIsSubmitting(true);
    try {
      const service = services.find(s => s.id === formData.serviceType);
      const orderId = editOrderId || generateOrderId();
      
      const processedFiles = await Promise.all(formData.files.map(async (f) => {
        try {
            const path = `${user.id}/uploads/${orderId}/client_uploads/${f.name}`;
            const url = await uploadFile(f, path);
            return { name: f.name, type: f.type, data: url };
        } catch (err) {
            console.error(`Failed to upload file ${f.name}:`, err);
            return null;
        }
      }));

      const validFiles = processedFiles.filter(f => f !== null) as { name: string; type: string; data: string }[];

      const processedVoiceClips = await Promise.all(formData.voiceClips.map(async (v) => {
        try {
            const path = `${user.id}/uploads/${orderId}/client_uploads/voice_notes/${v.name}.webm`;
            const url = await uploadFile(v.blob, path);
            return { name: v.name, type: 'audio/webm', data: url };
        } catch (err) {
            console.error("Voice note upload failed:", err);
            return null;
        }
      }));
      
      const validVoiceClips = processedVoiceClips.filter(v => v !== null) as { name: string; type: string; data: string }[];

      const customFields: Record<string, any> = {};
      const addIf = (key: string, val: any) => {
        if (!val) return;
        if (Array.isArray(val) && val.length === 0) return;
        if (Array.isArray(val) && typeof val[0] === 'object' && !val[0].handle && !val[0].title) return;
        customFields[key] = val;
      };

      addIf('Event Title', formData.eventTitle);
      addIf('Brand Name', formData.brandName);
      if(formData.socialLinks.some(l => l.handle)) customFields['Social Media'] = formData.socialLinks.filter(l => l.handle);
      addIf('Website', formData.websiteUrl);
      addIf('Target Audience', formData.audience); 
      addIf('Venue', formData.venue);
      addIf('Event Date', formData.eventDate);
      addIf('Event Time', formData.eventTime);
      addIf('Recipient', formData.recipient);
      addIf('Subject', formData.subject);
      addIf('Unit Name', formData.unitName);
      addIf('Tutor Name', formData.tutorName);
      addIf('Year', formData.year);
      addIf('Institutes', formData.institutes);
      addIf('Motto', formData.motto);
      addIf('Location', formData.location);
      if(formData.telephones.some(t => t)) customFields['Contact Numbers'] = formData.telephones.filter(t => t);
      if(formData.books.some(b => b.title)) customFields['Books'] = formData.books.filter(b => b.title);
      addIf('Extra Details', formData.extraDetails);

      let originalPrice = service?.price || 0;
      let finalPrice = originalPrice;
      let discountApplied = 0;
      
      const specificDiscount = serviceConfigs[formData.serviceType]?.discountPercentage || 0;
      const globalDiscount = globalDiscountConfig.isActive ? globalDiscountConfig.globalDiscount : 0;
      
      discountApplied = specificDiscount > 0 ? specificDiscount : globalDiscount;
      
      if (discountApplied > 0) {
        finalPrice = originalPrice - (originalPrice * (discountApplied / 100));
      }

      const orderPayload = {
        clientId: user.id,
        clientName: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        serviceType: service?.title || 'Custom',
        serviceId: formData.serviceType,
        industry: formData.industry || 'Design',
        targetAudience: formData.audience || 'General',
        requirements: formData.requirements || formData.extraDetails || 'See details in summary',
        competitors: '',
        keywords: formData.keywords,
        avoid: '',
        colorPalette: formData.colorPalette,
        extraDetails: formData.extraDetails,
        files: validFiles,      
        voiceClips: validVoiceClips, 
        status: OrderStatus.PENDING,
        estimatedCompletion: '3-5 Days',
        createdAt: new Date().toISOString(),
        price: finalPrice,
        originalPrice: originalPrice,
        discountApplied: discountApplied,
        dimensions: formData.dimensions,
        customFields: customFields, 
      };

      if (editOrderId) {
         const updatedOrder = { ...orderPayload, id: editOrderId };
         await updateOrder(updatedOrder);
         alert("Order updated successfully!");
         navigate(`/tracking?id=${editOrderId}`);
      } else {
         const newOrder = { ...orderPayload, id: orderId };
         await saveOrder(newOrder);
         await sendConfirmationEmail(newOrder);
         // Call Telegram Bot Notification
         await sendTelegramNotification(newOrder);
         alert("Order placed successfully!");
         navigate(`/tracking?id=${newOrder.id}`);
      }
    } catch (e: any) { 
        console.error(e);
        alert(`Submission failed: ${e.message || "Error saving data."}`); 
    } finally { setIsSubmitting(false); }
  };

  const renderDynamicForm = () => {
    const type = formData.serviceType;
    const inputClass = (errKey: string) => `w-full bg-slate-50 border rounded-2xl px-6 py-4 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 outline-none transition-all focus:bg-white dark:bg-slate-900 ${errors[errKey] ? 'border-red-500 bg-red-50/20 shadow-sm' : 'border-zinc-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 shadow-sm'}`;
    const ErrorMsg = ({ name }: { name: string }) => errors[name] ? <div className="text-red-500 text-[10px] font-bold mt-1.5 flex items-center gap-1.5"><AlertCircle size={10} /> {errors[name]}</div> : null;
    
    if (['s_social', 's_banner', 's_flyer'].includes(type)) {
      return (
        <div className="space-y-6">
          <div><input name="eventTitle" value={formData.eventTitle} onChange={handleInputChange} placeholder="Name of the Event *" className={inputClass('eventTitle')} /><ErrorMsg name="eventTitle" /></div>
          <div><textarea name="requirements" rows={3} value={formData.requirements} onChange={handleInputChange} placeholder="Details of the event (What is happening?) *" className={inputClass('requirements')}></textarea><ErrorMsg name="requirements" /></div>
          <div><input name="brandName" value={formData.brandName} onChange={handleInputChange} placeholder="Brand or Company Name *" className={inputClass('brandName')} /><ErrorMsg name="brandName" /></div>
           <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Social Media Links</label>
            {formData.socialLinks.map((link, i) => (
              <div key={i} className="flex gap-3"><select value={link.platform} onChange={(e) => updateList('socialLinks', i, 'platform', e.target.value)} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-slate-100 text-xs outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900"><option className="bg-white dark:bg-slate-900">WhatsApp</option><option className="bg-white dark:bg-slate-900">Facebook</option><option className="bg-white dark:bg-slate-900">Instagram</option><option className="bg-white dark:bg-slate-900">TikTok</option><option className="bg-white dark:bg-slate-900">LinkedIn</option></select><input value={link.handle} onChange={(e) => updateList('socialLinks', i, 'handle', e.target.value)} placeholder="@handle" className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-slate-100 text-xs outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900" />{formData.socialLinks.length > 1 && <button type="button" onClick={() => removeItem('socialLinks', i)} className="text-gray-400 hover:text-red-500"><MinusCircle size={20} /></button>}</div>
            ))}
            <button type="button" onClick={() => addItem('socialLinks', { platform: 'WhatsApp', handle: '' })} className="flex items-center gap-2 text-[10px] text-purple-600 font-black uppercase tracking-widest hover:text-purple-800"><PlusCircle size={16} /> Add Another</button>
          </div>
          <input name="websiteUrl" value={formData.websiteUrl} onChange={handleInputChange} placeholder="Website Link (Optional)" className={inputClass('websiteUrl')} />
          <input name="audience" value={formData.audience} onChange={handleInputChange} placeholder="Audience Targeting (Optional)" className={inputClass('audience')} />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <input name="industry" value={formData.industry} onChange={handleInputChange} placeholder="Industry (e.g. Music, Tech)" className={inputClass('industry')} />
        <textarea name="requirements" rows={6} value={formData.requirements} onChange={handleInputChange} placeholder="Describe your vision here..." className={inputClass('requirements')}></textarea>
      </div>
    );
  };

  const getStepClasses = (s: number) => `flex-1 ${step !== s ? 'hidden' : isExiting ? 'opacity-0 -translate-y-4' : 'animate-fade-in'}`;

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Order Project | Ranthul's Portfolio</title>
        <meta name="description" content="Start a new digital project. Share your ideas and let's craft something amazing." />
      </Helmet>
      <OfferBanner />
      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto w-full">
        <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-3 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100 transition-all bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-5 py-2.5 rounded-full shadow-sm"><HomeIcon size={18} /><span className="text-xs font-black uppercase tracking-widest">Back to Home</span></Link>
      </div>
      <div className="mb-10 text-center"><h1 className="text-5xl md:text-7xl font-display text-gray-900 dark:text-slate-100 mb-4 uppercase tracking-tighter leading-none">{editOrderId ? 'Edit Project' : selectedServiceTitle}</h1><p className="text-gray-500 dark:text-slate-400 font-light text-lg">{editOrderId ? 'Update your requirements' : 'Just 4 simple steps to bring your idea to life.'}</p></div>

      <div ref={formRef} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_15px_60px_rgba(0,0,0,0.07)] relative overflow-hidden flex flex-col md:flex-row min-h-[650px] border border-zinc-300">
        <div className="hidden md:flex flex-col w-64 bg-gray-50/70 border-r border-gray-100 dark:border-slate-700 p-10">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex items-center gap-4 mb-10 transition-all ${step === s ? 'text-purple-600 font-bold' : step > s ? 'text-gray-900 dark:text-slate-100' : 'text-gray-300'}`}>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-sm transition-all ${step === s ? 'border-purple-600 text-purple-600 bg-purple-50' : step > s ? 'border-purple-600 bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.15)]' : 'border-gray-200 dark:border-slate-700 text-gray-300'}`}>{step > s ? <Check size={18} strokeWidth={3} /> : s}</div>
              <span className="font-black text-[10px] tracking-widest uppercase">{s === 1 ? 'Basic Info' : s === 2 ? 'Details' : s === 3 ? 'Style' : 'Finish'}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 p-8 md:p-14 relative bg-transparent overflow-y-auto">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            
            {/* STEP 1: BASIC INFO */}
            <div className={getStepClasses(1)}>
              <h3 className="text-3xl font-display text-gray-900 dark:text-slate-100 mb-8 uppercase tracking-tight border-b border-gray-100 dark:border-slate-700 pb-4">Basic Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2"><label className="block text-[10px] font-black text-purple-600 mb-3 uppercase tracking-widest font-extrabold">Service</label><select name="serviceType" value={formData.serviceType} onChange={handleInputChange} disabled={!!editOrderId} className={`w-full bg-slate-50 border border-zinc-300 rounded-2xl px-6 py-5 text-gray-950 font-bold cursor-pointer outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all shadow-sm ${editOrderId ? 'opacity-50 cursor-not-allowed' : ''}`}>{services.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">{s.title} — LKR {s.price}</option>)}</select></div>
                <div><input name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name *" className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all shadow-sm ${errors.name ? 'border-red-500 bg-red-50/20' : 'border-zinc-300'}`} />{errors.name && <div className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</div>}</div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">WhatsApp Number *</label>
                    <div className="flex gap-2">
                        <select 
                            value={countryCode} 
                            onChange={e => setCountryCode(e.target.value)}
                            className="bg-slate-50 border border-zinc-300 rounded-2xl px-4 py-4 text-gray-900 dark:text-slate-100 outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 appearance-none text-center min-w-[80px] shadow-sm font-bold"
                        >
                            <option value="+94" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">🇱🇰 +94</option>
                            <option value="+1" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">🇺🇸 +1</option>
                            <option value="+44" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">🇬🇧 +44</option>
                            <option value="+61" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">🇦🇺 +61</option>
                            <option value="+91" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">🇮🇳 +91</option>
                            <option value="+971" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">🇦🇪 +971</option>
                            <option value="" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">Other</option>
                        </select>
                        <input 
                            type="tel" 
                            value={phoneInput} 
                            onChange={e => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))} 
                            placeholder="77 123 4567" 
                            className={`flex-1 bg-slate-50 border rounded-2xl px-6 py-4 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 ${errors.mobile ? 'border-red-500 bg-red-50/20' : 'border-zinc-300'} outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all shadow-sm font-semibold`} 
                        />
                    </div>
                    {errors.mobile && <div className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.mobile}</div>}
                </div>
                <div className="md:col-span-2"><input name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address *" className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all shadow-sm ${errors.email ? 'border-red-500 bg-red-50/20' : 'border-zinc-300'}`} />{errors.email && <div className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</div>}</div>
              </div>
            </div>

            {/* STEP 2: PROJECT DETAILS */}
            <div className={getStepClasses(2)}>
              <h3 className="text-3xl font-display text-gray-900 dark:text-slate-100 mb-8 uppercase tracking-tight border-b border-gray-100 dark:border-slate-700 pb-4">Project Details</h3>
              <div className="space-y-10">
                {renderDynamicForm()}
                
                <div className="pt-8 border-t border-gray-100 dark:border-slate-700">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Extra Context & Inspiration Boards</label>
                  <textarea 
                    name="extraDetails" 
                    rows={4} 
                    value={formData.extraDetails} 
                    onChange={handleInputChange} 
                    placeholder="Provide any additional context, specific color preferences, or links to inspiration boards here..." 
                    className="w-full bg-slate-50 border border-zinc-300 rounded-2xl px-6 py-4 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all shadow-sm"
                  ></textarea>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-slate-700"><label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">Can't describe it in text? Use voice:</label><div className="flex items-center gap-4"><button type="button" onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${isRecording ? 'bg-pink-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-250 border border-gray-200 dark:border-slate-700 hover:bg-gray-200'}`}>{isRecording ? <><Square size={14} fill="white" /> Stop Recording</> : <><Mic size={14} /> Record Voice</>}</button>{isRecording && <span className="text-pink-500 text-xs font-bold animate-pulse">Recording...</span>}</div></div>
                {formData.voiceClips.length > 0 && <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voice Notes</label>{formData.voiceClips.map((clip, i) => (<div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3 rounded-2xl"><div className="flex items-center gap-3"><Play size={14} className="text-purple-600" /><span className="text-xs font-bold text-gray-700 dark:text-slate-300">{clip.name}</span></div><div className="flex items-center gap-4"><audio src={clip.url} controls className="h-8 max-w-[150px] opacity-60" /><button type="button" onClick={() => removeVoiceClip(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></div></div>))}</div>}
              </div>
            </div>

            {/* STEP 3: STYLE & COLORS */}
            <div className={getStepClasses(3)}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
                    <h3 className="text-3xl font-display text-gray-900 dark:text-slate-100 uppercase tracking-tight">Dimension & Layout</h3>
                    <div className="text-[9px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-widest border border-purple-200">{selectedServiceTitle} Mode</div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Maximize size={12} className="text-purple-600" /> Professional Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currentPresets.map(p => {
                        const Icon = p.icon;
                        const isSelected = formData.dimensions.width === p.width && formData.dimensions.height === p.height;
                        return (
                          <button key={p.id} type="button" onClick={() => applyPreset(p.id)} className={`p-4 rounded-2xl text-left transition-all border group relative overflow-hidden ${isSelected ? 'bg-purple-50 border-purple-600' : 'bg-gray-50/50 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:border-slate-600'}`}>
                            <div className="flex items-center justify-between mb-3"><Icon size={18} className={isSelected ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-400'} />{isSelected && <Check size={14} className="text-purple-600" />}</div>
                            <div className={`text-[11px] font-black uppercase tracking-wider mb-1 ${isSelected ? 'text-gray-950' : 'text-gray-650 group-hover:text-gray-800 dark:text-slate-200'}`}>{p.name}</div>
                            <div className="text-[10px] font-mono text-gray-400 group-hover:text-gray-500 dark:text-slate-400">{p.width}x{p.height}{p.unit} @ {p.ppi}ppi</div>
                          </button>
                        );
                      })}
                      {currentPresets.length === 0 && <div className="col-span-full py-8 text-center bg-gray-5 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Manual setup required for this mode</p></div>}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 border border-zinc-300 space-y-8 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Width</label><input type="number" value={formData.dimensions.width} onChange={(e) => handleDimensionChange('width', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-4 text-gray-900 dark:text-slate-100 font-mono text-sm focus:border-purple-600 outline-none transition-all h-12" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Height</label><input type="number" value={formData.dimensions.height} onChange={(e) => handleDimensionChange('height', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-4 text-gray-900 dark:text-slate-100 font-mono text-sm focus:border-purple-600 outline-none transition-all h-12" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit</label><select value={formData.dimensions.unit} onChange={(e) => handleDimensionChange('unit', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-slate-100 text-xs outline-none focus:border-purple-600 cursor-pointer h-12"><option value="px">Pixels (px)</option><option value="in">Inches (in)</option><option value="mm">Millimeters (mm)</option><option value="cm">Centimeters (cm)</option><option value="m">Meters (m)</option><option value="pt">Points (pt)</option><option value="pc">Picas (pc)</option><option value="ft">Feet (ft)</option><option value="yd">Yards (yd)</option></select></div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-10">
                        <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orientation</label><div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 text-gray-300 border border-gray-200 dark:border-slate-700"><button type="button" onClick={toggleOrientation} className={`p-3 rounded-lg transition-all flex items-center justify-center gap-2 ${formData.dimensions.orientation === 'portrait' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:text-slate-300'}`}><div className="w-3 h-4 border-2 border-current rounded-sm"></div></button><button type="button" onClick={toggleOrientation} className={`p-3 rounded-lg transition-all flex items-center justify-center gap-2 ${formData.dimensions.orientation === 'landscape' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:text-slate-300'}`}><div className="w-4 h-3 border-2 border-current rounded-sm"></div></button></div></div>
                        <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolution (PPI)</label><select value={formData.dimensions.ppi} onChange={(e) => handleDimensionChange('ppi', e.target.value)} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-3 text-gray-900 dark:text-slate-100 text-xs outline-none block focus:border-purple-600 cursor-pointer h-12 align-middle"><option value="72">72 (Screen / Web)</option><option value="150">150 (Digital Print)</option><option value="300">300 (Offset Print)</option></select></div>
                      </div>
                      <div className="text-right flex flex-col items-end"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Scale Ratio</label><div className="text-purple-600 font-mono text-3xl font-black leading-none">{formData.dimensions.aspectRatio}</div><div className="text-[9px] text-gray-400 font-bold uppercase mt-1">calculated scale</div></div>
                    </div>
                  </div>

                  <div><label className="text-[10px] font-black text-gray-400 mb-3 block uppercase tracking-widest">Style Keywords</label><input name="keywords" value={formData.keywords} onChange={handleInputChange} placeholder="Modern, Bold, Minimalist, Luxury..." className="w-full bg-gray-55 border border-gray-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all shadow-sm" /></div>
                </div>

                <div className="space-y-8 font-sans">
                  <h3 className="text-3xl font-display text-gray-900 dark:text-slate-100 mb-6 uppercase tracking-tight border-b border-gray-100 dark:border-slate-700 pb-4">Style & Colors</h3>
                  <div className="flex flex-col items-center xl:items-start gap-10">
                    <PhotoshopColorPicker color={customColor} onChange={setCustomColor} onAdd={(c) => formData.colorPalette.length < 5 && !formData.colorPalette.includes(c) && setFormData(p => ({ ...p, colorPalette: [...p.colorPalette, c] }))} isPrintMode={isPrintMode} canAdd={formData.colorPalette.length < 5} />
                    <div className="w-full max-w-sm"><label className="text-[10px] font-black text-gray-400 mb-5 block uppercase tracking-widest flex items-center justify-between">Chosen Palette <span className="text-[9px] font-mono text-gray-400">{formData.colorPalette.length}/5 Colors</span></label><div className="flex flex-wrap gap-4">{formData.colorPalette.length === 0 && <div className="w-full py-4 text-center border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl"><span className="text-[10px] text-gray-400 uppercase font-black italic tracking-widest">Add colors from picker above</span></div>}{formData.colorPalette.map(c => (<div key={c} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-full px-5 py-2.5 border border-gray-200 dark:border-slate-700 group animate-fade-in hover:border-gray-300 dark:border-slate-600 transition-all shadow-md"><div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: c }}></div><span className="text-[10px] font-mono font-black uppercase text-gray-700 dark:text-slate-300">{c}</span><button type="button" onClick={() => setFormData(prev => ({ ...prev, colorPalette: prev.colorPalette.filter(x => x !== c) }))} className="text-gray-400 hover:text-red-500 transition-colors ml-2"><X size={14} /></button></div>))}</div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: UPLOAD & FINISH */}
            <div className={getStepClasses(4)}>
              <h3 className="text-3xl font-display text-gray-900 dark:text-slate-100 mb-8 uppercase tracking-tight border-b border-gray-100 dark:border-slate-700 pb-4">Upload Assets</h3>
              <div className="space-y-8">
                <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-[2.5rem] p-12 text-center bg-gray-50/50 hover:bg-gray-100 dark:hover:bg-slate-700/30 hover:border-gray-300 dark:border-slate-600 transition-all relative group cursor-pointer"><input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => e.target.files?.length && setFormData(p => ({ ...p, files: [...p.files, ...Array.from(e.target.files!)] }))} /><Upload className="mx-auto mb-4 text-purple-600 animate-pulse" size={40} /><p className="text-lg font-bold uppercase tracking-widest text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:text-slate-100">Choose Photos or Logos</p></div>
                {formData.files.length > 0 && <div className="flex gap-2 flex-wrap">{formData.files.map((f, i) => (
                    <div key={i} className="text-[9px] font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-4 pr-2 py-2 rounded-full text-gray-500 dark:text-slate-400 flex items-center gap-2 group hover:bg-red-500/10 hover:text-red-600 hover:border-red-200 transition-colors">
                        <Check size={10} className="text-green-500 group-hover:hidden" />
                        <Trash2 size={10} className="hidden group-hover:block" />
                        {f.name}
                        <button type="button" onClick={() => removeFile(i)} className="p-1 hover:text-red-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"><X size={12} /></button>
                    </div>
                ))}</div>}
                <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-200 dark:border-slate-700"><div className="text-purple-600 font-black text-[10px] uppercase mb-4 tracking-widest flex items-center gap-2"><ShieldCheck size={14} /> Ready to start</div><div className="grid grid-cols-2 gap-8 text-xs"><div><p className="text-gray-400 uppercase text-[9px] mb-2 font-black">Project Type</p><p className="text-gray-800 dark:text-slate-200 font-bold">{selectedServiceTitle}</p></div><div><p className="text-gray-400 uppercase text-[9px] mb-2 font-black">Color Mode</p><p className="text-gray-800 dark:text-slate-200 font-bold">{isPrintMode ? 'Print Ready (CMYK)' : 'Web (RGB)'}</p></div></div></div>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-center pt-10 border-t border-gray-100 dark:border-slate-700 sticky bottom-0 bg-transparent pb-4">
               {step > 1 ? <button type="button" onClick={() => changeStep(step - 1)} className="text-gray-400 hover:text-gray-900 dark:text-slate-100 uppercase text-[10px] font-black tracking-widest flex items-center gap-3"><ArrowLeft size={16} /> Go Back</button> : <div />}
               {step < 4 ? <button type="button" onClick={handleNextStep} className="bg-purple-600 text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-md">Continue</button> : 
               <button type="submit" disabled={isSubmitting} className="bg-purple-600 text-white px-14 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2 hover:bg-purple-700">
                 {isSubmitting && <Loader size={14} className="animate-spin" />}
                 {isSubmitting ? 'Processing...' : editOrderId ? 'Update Order' : 'Submit Order'}
               </button>}
            </div>
          </form>
        </div>
      </div>
     </div>
    </div>
  );
};