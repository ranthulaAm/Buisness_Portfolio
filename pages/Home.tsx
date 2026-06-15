import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Maximize2, X, Package, User as UserIcon, ChevronDown } from 'lucide-react';
import { SERVICES as DEFAULT_SERVICES, PORTFOLIO_ITEMS as DEFAULT_PORTFOLIO } from '../constants';
import { User } from '../types';
import { 
  getPortfolioItems, 
  getServicesConfig, 
  getDiscountsConfig,
  getSkills, 
  getEducation, 
  getExperience, 
  addContact,
  getTestimonials,
  PortfolioItem,
  SkillItem,
  EducationItem,
  ExperienceItem,
  Testimonial
} from '../services/dataService';
import { InteractiveButton } from '../components/InteractiveButton';
import { OfferBanner } from '../components/OfferBanner';

interface HomeProps {
  user: User | null;
  onLoginClick: () => void;
}

const ServiceVisual: React.FC<{ id: string }> = ({ id }) => {
  const fillColor = "fill-white/10";

  switch (id) {
    case 's_social':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
             <clipPath id="screen-mask">
               <rect x="60" y="40" width="80" height="120" />
             </clipPath>
          </defs>
          <rect x="55" y="30" width="90" height="140" rx="10" className="fill-white/5 stroke-white/20 stroke-2" />
          <path d="M95 35 h10" className="stroke-white/20 stroke-2" />
          <circle cx="100" cy="160" r="3" className="fill-white/20" />
          <g clipPath="url(#screen-mask)">
             <g style={{ animation: 'scroll-feed 4s linear infinite' }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <g key={i} transform={`translate(65, ${45 + i * 55})`}>
                     <rect width="70" height="35" rx="2" className="fill-white/10" />
                     <line x1="0" y1="40" x2="60" y2="40" className="stroke-white/10 stroke-2" />
                     <line x1="0" y1="46" x2="40" y2="46" className="stroke-white/10 stroke-2" />
                  </g>
                ))}
             </g>
          </g>
          <circle cx="100" cy="130" r="12" className="fill-white/30 blur-sm animate-[scroll-touch_4s_ease-in-out_infinite]" />
        </svg>
      );
    case 's_invite':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <g transform="translate(0, 20)">
             <rect x="40" y="60" width="120" height="80" rx="4" className={fillColor + " stroke-white/20 stroke-2"} />
             <line x1="60" y1="90" x2="140" y2="90" className="stroke-white/20 stroke-2" />
             <line x1="60" y1="110" x2="110" y2="110" className="stroke-white/20 stroke-2" />
             <path d="M40 60 L100 100 L160 60" className="fill-none stroke-white/50 stroke-2" />
             <path d="M40 60 L100 20 L160 60" className="fill-white/5 stroke-white/50 stroke-2 animate-[float-slow_3s_ease-in-out_infinite]" />
           </g>
        </svg>
      );
    case 's_banner':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <path d="M80 180 L80 160 L120 160 L120 180" className="fill-white/5 stroke-white/10" />
           <g transform="translate(0, -10)">
              <rect x="95" y="100" width="10" height="60" className="fill-white/10" />
              <line x1="50" y1="100" x2="95" y2="140" className="stroke-white/20 stroke-1" />
              <line x1="150" y1="100" x2="105" y2="140" className="stroke-white/20 stroke-1" />
              <rect x="30" y="40" width="140" height="70" className="fill-white/5 stroke-white/30 stroke-2" />
              <rect x="35" y="45" width="130" height="60" className="fill-white/10" />
              <circle cx="60" cy="75" r="18" className="fill-white/10" />
              <rect x="90" y="65" width="60" height="8" className="fill-white/20" />
              <rect x="90" y="78" width="40" height="5" className="fill-white/10" />
              <g className="fill-white/40">
                <circle cx="45" cy="35" r="2" /><path d="M45 35 L45 40" className="stroke-white/30" />
                <circle cx="80" cy="35" r="2" /><path d="M80 35 L80 40" className="stroke-white/30" />
                <circle cx="120" cy="35" r="2" /><path d="M120 35 L120 40" className="stroke-white/30" />
                <circle cx="155" cy="35" r="2" /><path d="M155 35 L155 40" className="stroke-white/30" />
              </g>
           </g>
        </svg>
      );
    case 's_flyer':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <g transform="translate(100, 100)">
             <g style={{ transformOrigin: '50% 100%', animation: 'fan-out-left 6s ease-in-out infinite' }}>
                <rect x="-20" y="-30" width="40" height="60" rx="2" className="fill-white/5 stroke-white/20 stroke-2" />
                <rect x="-15" y="-25" width="30" height="20" className="fill-white/10" />
                <line x1="-15" y1="5" x2="15" y2="5" className="stroke-white/20" />
             </g>
             <g style={{ transformOrigin: '50% 100%', animation: 'fan-out-right 6s ease-in-out infinite' }}>
                <rect x="-20" y="-30" width="40" height="60" rx="2" className="fill-white/5 stroke-white/20 stroke-2" />
                <rect x="-15" y="-25" width="30" height="20" className="fill-white/10" />
                <line x1="-15" y1="5" x2="15" y2="5" className="stroke-white/20" />
             </g>
             <g>
                <rect x="-20" y="-30" width="40" height="60" rx="2" className="fill-white/10 stroke-white/60 stroke-2" />
                <circle cx="0" cy="-15" r="8" className="fill-white/20" />
                <line x1="-15" y1="5" x2="15" y2="5" className="stroke-white/40" />
             </g>
           </g>
        </svg>
      );
    case 's_tute':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <g transform="translate(75, 75)">
              <rect x="0" y="0" width="50" height="70" rx="2" className="fill-white/5 stroke-white/10" style={{ '--tx': '15px', '--ty': '-15px', animation: 'stack-float 6s ease-in-out infinite' } as React.CSSProperties} />
              <rect x="0" y="0" width="50" height="70" rx="2" className="fill-white/10 stroke-white/20" style={{ '--tx': '8px', '--ty': '-8px', animation: 'stack-float 6s ease-in-out infinite 0.2s' } as React.CSSProperties} />
              <rect x="0" y="0" width="50" height="70" rx="2" className="fill-white/20 stroke-white/50 stroke-2" />
              <line x1="10" y1="15" x2="40" y2="15" className="stroke-white/50 stroke-2" />
           </g>
        </svg>
      );
    case 's_letterhead':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <rect x="50" y="40" width="100" height="120" className="fill-white/5 stroke-white/20 stroke-2" />
           {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1="65" y1={70 + i * 15} x2="135" y2={70 + i * 15} className="stroke-white/60 stroke-2" style={{ strokeDasharray: 100, animation: `draw-line 4s ease-in-out infinite ${i * 0.5}s` }} />
           ))}
        </svg>
      );
    case 's_book':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
           <g transform="translate(100, 100)">
              <circle cx="0" cy="-40" r="20" className="fill-white/80 animate-[float-slow_5s_ease-in-out_infinite]" filter="url(#glow)" />
              <path d="M-50 60 Q0 80 50 60" className="fill-none stroke-white/30 stroke-2" />
              <g transform="translate(0, 10)">
                <rect x="-40" y="-10" width="38" height="50" className="fill-white/10 stroke-white/20" rx="2" />
                <rect x="2" y="-10" width="38" height="50" className="fill-white/10 stroke-white/20" rx="2" />
                <g className="origin-left" style={{ transformBox: 'fill-box' }}>
                   <rect x="2" y="-10" width="36" height="48" className="fill-white/40 opacity-80" rx="1" style={{ animation: 'page-flip 6s ease-in-out infinite', transformOrigin: '0 0' }} />
                </g>
              </g>
           </g>
        </svg>
      );
    case 's_businesscard':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
           <g transform="translate(100, 130)">
              <g style={{ animation: 'float-slow 5s ease-in-out infinite' }}>
                <path d="M-30 -20 Q-20 -40 -10 -20" className="fill-white/5 stroke-white/20" />
                <path d="M-10 -25 Q0 -45 10 -25" className="fill-white/5 stroke-white/20" />
                <path d="M10 -20 Q20 -40 30 -20" className="fill-white/5 stroke-white/20" />
                <g transform="rotate(-5)">
                  <rect x="-50" y="-80" width="100" height="60" rx="4" className="fill-white/10 stroke-white/40 stroke-2" />
                  <circle cx="-25" cy="-50" r="10" className="fill-white/20" />
                  <line x1="0" y1="-60" x2="35" y2="-60" className="stroke-white/30 stroke-2" />
                  <line x1="-35" y1="-35" x2="35" y2="-35" className="stroke-white/30 stroke-1" />
                </g>
                <path d="M-20 0 C-20 -20 20 -20 20 0 L20 40 L-20 40 Z" className="fill-white/20 stroke-white/30" />
              </g>
           </g>
        </svg>
      );
    default:
      return null;
  }
};

export const Home: React.FC<HomeProps> = ({ user, onLoginClick }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const workId = searchParams.get('work');
  
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQS = [
    { question: "What is the typical turnaround time?", answer: "Standard projects usually take 3-5 business days. Complex requests may take longer, which will be communicated upfront." },
    { question: "How does the revision process work?", answer: "We offer up to 3 rounds of free revisions for most of our design services to ensure you are completely satisfied with the final result." },
    { question: "Can I provide my own visual assets?", answer: "Absolutely! You can upload your own photos, logos, or inspiration boards when placing an order or through the tracking dashboard later." },
    { question: "How do I communicate with the designer?", answer: "You can track your project status and leave feedback directly via your Client Dashboard. Admins will also reach out if clarification is needed."}
  ];

  // New states
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', whatsapp: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    if (user) {
      setContactForm(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    // Load fresh data
    getPortfolioItems().then(items => {
       if (items.length > 0) setPortfolio(items as any);
       setLoadingPortfolio(false);
    }).catch(err => {
       console.error(err);
       setLoadingPortfolio(false);
    });

    Promise.all([getServicesConfig(), getDiscountsConfig()]).then(([configs, discountInfo]) => {
      let baseServices = [...DEFAULT_SERVICES];
      
      // Add custom ones from configs that aren't in DEFAULT_SERVICES
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

      setServices(baseServices.map(s => {
        let finalPrice = s.price;
        let originalPrice = s.price;
        let discountApplied = 0;
        let hidden = false;

        if (configs[s.id]) {
            originalPrice = configs[s.id].price;
            finalPrice = originalPrice;
            hidden = configs[s.id].hidden || false;
            
            // overrides for custom elements
            if (configs[s.id].isCustom) {
               s.title = configs[s.id].title || s.title;
               s.description = configs[s.id].description || s.description;
               s.image = configs[s.id].image || s.image;
               s.features = configs[s.id].features || s.features;
            }
            
            const specificDiscount = configs[s.id].discountPercentage || 0;
            const globalDiscount = discountInfo.isActive ? discountInfo.globalDiscount : 0;
            discountApplied = specificDiscount > 0 ? specificDiscount : globalDiscount;
            
            if (discountApplied > 0) {
                finalPrice = originalPrice - (originalPrice * (discountApplied / 100));
            }
        }
        
        return {
            ...s,
            price: finalPrice,
            originalPrice: originalPrice,
            discountPercentage: discountApplied,
            hidden: hidden
        };
      }));
    }).catch(console.error);

    // Fetch skills, education, experience
    getSkills().then(setSkills).catch(console.error);
    getEducation().then(setEducation).catch(console.error);
    getExperience().then(setExperience).catch(console.error);
    getTestimonials().then(setTestimonials).catch(console.error);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.message) return;
    setContactStatus('loading');
    try {
      await addContact({
        name: contactForm.name,
        email: user ? user.email : contactForm.email,
        whatsapp: contactForm.whatsapp,
        message: contactForm.message,
        createdAt: new Date().toISOString(),
        isRead: false,
        clientId: user ? user.id : undefined
      });
      setContactStatus('success');
      setContactForm({ name: '', email: user ? user.email : '', whatsapp: '', message: '' });
      setTimeout(() => setContactStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setContactStatus('idle');
    }
  };

  const selectedWork = useMemo(() => {
    if (!workId) return null;
    return portfolio.find(item => item.id.toString() === workId) || null;
  }, [workId, portfolio]);

  const closeLightbox = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('work');
    setSearchParams(nextParams);
  };

  const openWork = (id: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('work', id.toString());
    setSearchParams(nextParams);
  };

  useEffect(() => {
    if (selectedWork) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => { document.body.classList.remove('overflow-hidden'); }
  }, [selectedWork]);

  return (
    <div className="flex flex-col min-h-screen text-gray-900">
      <Helmet>
        <title>Ranthul's Portfolio | Digital Creator</title>
        <meta name="description" content="Immersive brand experiences crafted with precision. Visual soundscapes for your digital identity." />
      </Helmet>

      <OfferBanner />
      
      {/* 1. HERO SECTION */}
      <section className="min-h-[90vh] flex flex-col justify-center items-center text-center px-4 md:px-12 max-w-7xl mx-auto pt-20 relative z-10">
        <div className="max-w-5xl">
            <h1 className="text-3xl sm:text-4xl md:text-8xl font-display font-bold mb-8 tracking-tight md:tracking-tighter leading-tight md:leading-none animate-fade-in select-none">
              <span className="block text-gray-900 mb-2 md:mb-0">Bring your ideas</span>
              <span className="block text-gray-900 mb-2 md:mb-0">to life with</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-gradient pb-2">vivid visuals!</span>
            </h1>
            
            <p className="text-base md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 md:mb-16 font-light leading-relaxed animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
              Immersive brand experiences crafted with precision. <br className="hidden md:block" />
              Visual soundscapes for your digital identity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in w-full max-w-sm sm:max-w-none mx-auto" style={{ animationDelay: '0.4s' }}>
                <InteractiveButton onClick={() => navigate('/order')} className="w-full sm:w-auto">
                   START PROJECT
                </InteractiveButton>

                <InteractiveButton onClick={() => navigate('/tracking')} className="w-full sm:w-auto !bg-gray-100 !text-gray-900 hover:!bg-gray-200">
                   TRACK ORDER
                </InteractiveButton>

                {!user && (
                  <InteractiveButton onClick={onLoginClick} className="w-full sm:w-auto !bg-purple-100 !text-purple-600 hover:!bg-purple-200">
                     SIGN IN
                  </InteractiveButton>
                )}
            </div>
        </div>
      </section>

      {/* 2. SKILLS */}
      {skills.filter(s => !s.hidden).length > 0 && (
        <section className="py-24">
          <div className="px-6 md:px-12 max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display tracking-tight text-gray-900 mb-16 text-center">Software Skills</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {skills.filter(s => !s.hidden).map((skill, idx) => (
                <div key={skill.id || `skill-${idx}`} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-end mb-4">
                    <h4 className="font-bold text-gray-900 text-lg">{skill.name}</h4>
                    <span className="text-sm font-mono text-gray-400 font-bold">{skill.level}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. EXPERIENCE & EDUCATION */}
      {(experience.filter(e => !e.hidden).length > 0 || education.filter(e => !e.hidden).length > 0) && (
        <section className="py-24 bg-gray-50 border-y border-gray-100">
          <div className="px-6 md:px-12 max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display tracking-tight text-gray-900 mb-16 text-center">Journey & Background</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Experience */}
              {experience.filter(e => !e.hidden).length > 0 && (
                <div>
                  <h3 className="text-2xl font-display font-medium text-gray-900 mb-8 border-b border-gray-200 pb-4 flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Professional Experience
                  </h3>
                  <div className="space-y-8">
                    {experience.filter(e => !e.hidden).map((exp, idx) => (
                      <div key={exp.id || `exp-${idx}`} className="relative pl-6 border-l-2 border-purple-100 pb-4">
                        <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white]"></div>
                        <div className="text-sm font-mono text-purple-600 font-bold mb-1 tracking-wider">{exp.period}</div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{exp.role}</h4>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">{exp.company}</div>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.filter(e => !e.hidden).length > 0 && (
                <div>
                  <h3 className="text-2xl font-display font-medium text-gray-900 mb-8 border-b border-gray-200 pb-4 flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Education
                  </h3>
                  <div className="space-y-8">
                    {education.filter(e => !e.hidden).map((edu, idx) => (
                      <div key={edu.id || `edu-${idx}`} className="relative pl-6 border-l-2 border-blue-100 pb-4">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white]"></div>
                        <div className="text-sm font-mono text-blue-600 font-bold mb-1 tracking-wider">{edu.year}</div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{edu.degree}</h4>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">{edu.institution}</div>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{edu.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. SELECTED WORKS */}
      <section className="py-24">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
             <h2 className="text-5xl md:text-7xl font-display tracking-tighter text-gray-900">Selected<br/>Works</h2>
             <div className="h-px bg-gray-300 flex-1 mx-8 hidden md:block"></div>
             <p className="text-gray-500 max-w-xs text-sm">Curated projects that define visual landscapes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {loadingPortfolio ? (
              [1, 2, 3, 4, 5, 6].map((i, idx) => (
                <div 
                  key={`skeleton-${i}`}
                  className={`animate-pulse bg-gray-200 rounded-xl ${idx === 0 || idx === 5 ? 'md:col-span-2 aspect-[16/10] md:aspect-[21/9]' : 'aspect-[4/5]'}`}
                ></div>
              ))
            ) : portfolio.map((item, idx) => (
              <div 
                key={item.id}
                onClick={() => openWork(item.id)}
                className={`group relative rounded-xl overflow-hidden transition-all duration-300 
                  ${idx === 0 || idx === 5 ? 'md:col-span-2 aspect-[16/10] md:aspect-[21/9]' : 'aspect-[4/5]'} 
                  cursor-pointer bg-white border border-gray-200 hover:shadow-2xl`}
              >
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white/80 backdrop-blur-md p-3 rounded-full border border-gray-200 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors">
                    <Maximize2 size={20} />
                  </div>
                </div>

                {item.videoUrl ? (
                  <video 
                    src={item.videoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                  />
                ) : (
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center', 'border', 'border-gray-200');
                      const div = document.createElement('div');
                      div.className = 'text-center p-6 w-full';
                      const fileName = item.img.split('/').pop();
                      div.innerHTML = `
                        <div class="text-gray-400 mb-2 font-mono text-xs uppercase tracking-widest">Image Missing</div>
                        <div class="text-gray-900 font-display text-xl mb-3">${item.title}</div>
                        <div class="bg-white p-2 rounded text-xs text-orange-500 font-mono break-all border border-orange-200">${fileName}</div>
                      `;
                      e.currentTarget.parentElement?.appendChild(div);
                    }}
                  />
                )}
                
                {/* Removed gradient overlay as mix-blend-difference handles contrast automatically */}
                
                <div className="absolute bottom-0 left-0 p-6 md:p-8 transform translate-y-4 md:translate-y-8 md:group-hover:translate-y-0 transition-transform duration-300 w-full">
                  <div className="text-xs text-white font-bold uppercase tracking-widest mb-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity delay-100 mix-blend-difference">
                    {item.category}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display text-white mb-2 mix-blend-difference">{item.title}</h3>
                  <p className="text-white/90 text-sm max-w-lg line-clamp-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity delay-200 hidden md:block mix-blend-difference">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SERVICES SECTION */}
      <section id="services" className="py-24 relative z-10 bg-gray-50 border-y border-gray-100">
        <div className="px-6 md:px-12 max-w-7xl mx-auto mb-12 flex items-end justify-between">
          <h2 className="text-3xl font-display text-gray-900">Select Mode</h2>
          <span className="text-xs text-gray-400 uppercase tracking-widest hidden md:block">Choose your workflow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6 md:px-12 max-w-7xl mx-auto">
          {services.filter(s => !(s as any).hidden).map((service, idx) => (
            <Link 
              key={service.id} 
              to={`/order?service=${service.id}`} 
              className="group relative h-[480px] bg-white rounded-[2rem] p-8 flex flex-col justify-between border border-gray-200 transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 left-0 w-full h-full opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none invert mix-blend-multiply">
                <ServiceVisual id={service.id} />
              </div>
              
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-xs font-mono text-gray-400 border border-gray-200 px-2 py-1 rounded-full text-center">0{idx + 1}</span>
                   <ArrowRight className="text-transparent group-hover:text-purple-600 transition-all duration-300 -translate-x-4 group-hover:translate-x-0" />
                 </div>
                 <h3 className="text-2xl md:text-3xl font-display mb-2 leading-tight text-gray-900">{service.title}</h3>
                 <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{service.description}</p>
              </div>

              <div className="relative z-10 border-t border-gray-100 pt-6">
                <div className="mb-4">
                    {service.discountPercentage && service.discountPercentage > 0 && service.originalPrice ? (
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-3">
                             <div className="text-4xl font-light text-gray-900">LKR {service.price.toLocaleString()}</div>
                             <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded font-black text-sm uppercase tracking-widest animate-pulse border border-rose-200 shadow-sm">{service.discountPercentage}% OFF</span>
                           </div>
                           <span className="text-base text-gray-400 line-through">LKR {service.originalPrice.toLocaleString()}</span>
                         </div>
                    ) : (
                         <div className="text-4xl font-light text-gray-900">LKR {service.price.toLocaleString()}</div>
                    )}
                </div>
                <ul className="space-y-2">
                  {service.features.slice(0, 3).map((f, i) => (
                     <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div> {f}
                     </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-white">
          <div className="px-6 md:px-12 max-w-7xl mx-auto">
            <div className="flex flex-col items-center mb-16 text-center">
               <h2 className="text-4xl md:text-6xl font-display tracking-tight text-gray-900 mb-4">Client Feedback</h2>
               <p className="text-gray-500 max-w-lg text-sm">Real stories from the brands and individuals I've collaborated with.</p>
            </div>
            
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {testimonials.map((t, idx) => (
                <div key={t.id || idx} className="min-w-[300px] md:min-w-[400px] bg-gray-50 border border-gray-100 p-8 rounded-[2rem] snap-center flex-shrink-0 relative mt-8 flex flex-col">
                   <div className="absolute -top-6 left-8 bg-purple-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg font-serif italic text-3xl">"</div>
                   <p className="text-gray-600 font-medium leading-relaxed mb-8 pt-4 text-sm md:text-base flex-1">
                      {t.feedback}
                   </p>
                   {t.rating && (
                     <div className="flex gap-1 text-lg mb-4">
                        {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= t.rating! ? 'text-yellow-400' : 'text-gray-300'}>★</span>)}
                     </div>
                   )}
                   <div>
                      <div className="font-bold text-gray-900 text-lg">{t.clientName}</div>
                      <div className="text-xs uppercase tracking-widest text-purple-600 font-bold mt-1">{t.projectRole}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6.5 FAQ SECTION */}
      <section className="py-24 bg-gray-50">
        <div className="px-6 md:px-12 max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-16 text-center">
             <h2 className="text-4xl md:text-6xl font-display tracking-tight text-gray-900 mb-4">Frequently Asked Questions</h2>
             <p className="text-gray-500 max-w-lg text-sm">Everything you need to know about the product and billing.</p>
          </div>
          <div className="space-y-4">
             {FAQS.map((faq, idx) => (
               <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all shadow-sm">
                 <button 
                   onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                   className="w-full px-6 py-5 text-left flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                  >
                   <span className="font-medium text-gray-900">{faq.question}</span>
                   <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                 </button>
                 <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                   <div className="px-6 pb-5 pt-0 text-gray-500 text-sm leading-relaxed">
                     {faq.answer}
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT / LET'S WORK TOGETHER */}
      <section className="py-32 bg-gray-900 text-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/40 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-900/30 to-transparent pointer-events-none"></div>
        
        <div className="px-6 md:px-12 max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tighter">Let's work together</h2>
          <p className="text-gray-400 mb-12 text-lg max-w-2xl mx-auto">
            Have a project in mind? Looking to collaborate? Fill out the form below and I'll get back to you as soon as possible.
          </p>
          
          <form onSubmit={handleContactSubmit} className="bg-white/5 backdrop-blur-md border border-white/20 p-8 md:p-10 rounded-3xl text-left max-w-2xl mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Your Name</label>
              <input 
                type="text" 
                required
                value={contactForm.name}
                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors shadow-inner"
                placeholder="John Doe"
              />
            </div>
            
            {!user && (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors shadow-inner"
                  placeholder="john@example.com"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">WhatsApp Number</label>
              <input 
                type="text" 
                value={contactForm.whatsapp}
                onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors shadow-inner"
                placeholder="+1 234 567 890"
              />
            </div>
            
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Message</label>
              <textarea 
                required
                value={contactForm.message}
                onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors min-h-[120px] resize-none shadow-inner"
                placeholder="Tell me about your project..."
              />
            </div>
            
            <button 
              type="submit" 
              disabled={contactStatus !== 'idle'}
              className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {contactStatus === 'loading' ? 'Sending...' : contactStatus === 'success' ? 'Message Sent!' : 'Send Message'}
              {contactStatus === 'idle' && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </section>

      {/* SMART LIGHTBOX MODAL - FIXED CENTER POSITIONING */}
      {selectedWork && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-[fadeIn_0.3s_ease-out_forwards] overflow-y-auto overflow-x-hidden">
          <div className="fixed inset-0 bg-white/95 backdrop-blur-xl" onClick={closeLightbox}></div>
          
          <div className="relative w-full max-w-6xl my-auto pointer-events-none">
            {/* Close Button Mobile (Sticky-style) */}
            <button 
              onClick={closeLightbox} 
              className="fixed top-6 right-6 text-gray-500 hover:text-gray-900 pointer-events-auto transition-all z-[110] p-2 bg-white/80 backdrop-blur-md rounded-full border border-gray-200 md:hidden shadow-sm"
            >
              <X size={24} />
            </button>

            {/* Close Button Desktop */}
            <button 
              onClick={closeLightbox} 
              className="absolute -top-12 -right-12 text-gray-400 hover:text-gray-900 pointer-events-auto transition-colors z-50 p-2 group hidden md:flex items-center"
            >
              <span className="mr-2 text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
              <X size={32} />
            </button>

            <div className="flex flex-col md:flex-row gap-6 md:gap-12 pointer-events-auto items-center">
              {/* Image Container */}
              <div className="flex-1 w-full flex items-center justify-center relative rounded-2xl overflow-hidden shadow-2xl bg-gray-50 border border-gray-100">
                 <img 
                   src={selectedWork.img} 
                   alt={selectedWork.title} 
                   className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain" 
                 />
              </div>

              {/* Text Container */}
              <div className="w-full md:w-[400px] flex flex-col justify-center bg-white/60 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none p-6 md:p-0 rounded-2xl md:rounded-none border border-gray-300 md:border-none shadow-[0_8px_32px_rgba(0,0,0,0.12)] md:shadow-none">
                  <div className="flex items-center gap-3 mb-4">
                     <span className="h-px w-8 bg-purple-500"></span>
                     <span className="text-purple-600 text-xs font-bold uppercase tracking-widest">{selectedWork.category}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-6 leading-tight">{selectedWork.title}</h2>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light border-l border-gray-200 pl-5 py-1 mb-8">
                    {selectedWork.description}
                  </p>
                  
                  <div className="flex flex-col gap-4">
                     <InteractiveButton onClick={() => {
                        navigate(`/order?service=${encodeURIComponent(selectedWork.category)}&title=${encodeURIComponent(selectedWork.title)}`);
                        closeLightbox();
                     }}>
                        Start Similar Project
                     </InteractiveButton>
                     <button onClick={closeLightbox} className="md:hidden w-full py-4 bg-gray-100 text-gray-500 border border-gray-200 font-bold rounded-full uppercase tracking-wider text-xs shadow-sm hover:bg-gray-200">
                        Back to Portfolio
                     </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};