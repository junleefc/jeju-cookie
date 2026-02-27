import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { get, set } from 'idb-keyval';
import { X, Check } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const IMAGE_PROMPTS = {
  heroBg: { prompt: 'Cinematic wide shot of a rustic wooden table with artisanal butter cookies and jars of colorful spreads (matcha green, tangerine orange, peanut brown). Soft morning light, Jeju island aesthetic, highly detailed, photorealistic.', aspectRatio: '16:9' },
  hero: { prompt: 'High-end editorial food photography. A stack of artisanal butter cookies next to a small glass jar of vibrant green matcha spread. Moody lighting, cream background, highly detailed, minimalist.', aspectRatio: '3:4' },
  bgTexture: { prompt: 'A dark, moody, highly detailed macro texture of dark volcanic basalt rock from Jeju island. Earthy tones, subtle lighting, abstract nature background.', aspectRatio: '16:9' },
  natureJeju: { prompt: 'Cinematic wide landscape photography of Jeju island. A beautiful view of the deep blue ocean meeting lush green volcanic mountains. Clear sky, high-end editorial travel photography, vibrant but moody colors.', aspectRatio: '3:4' },
  grid1: { prompt: 'Close-up macro food photography. A crisp golden butter cookie being dipped into a thick, vibrant green matcha spread. Elegant, appetizing, moody lighting.', aspectRatio: '1:1' },
  grid2: { prompt: 'Close-up food photography. A small glass jar filled with bright orange tangerine spread, placed next to a golden butter cookie. Soft natural light, dark background.', aspectRatio: '1:1' },
  grid3: { prompt: 'Top-down view of a single, perfectly baked golden butter cookie on a textured cream ceramic plate. Minimalist, elegant, soft shadows.', aspectRatio: '1:1' },
  grid4: { prompt: 'Macro shot of a creamy, rich brown peanut spread being swirled with a silver spoon. Highly detailed, appetizing texture, moody lighting.', aspectRatio: '1:1' }
};

function useAIGeneratedImages() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function loadImages() {
      const loadedImages: Record<string, string> = {};
      const keys = Object.keys(IMAGE_PROMPTS);
      let loadedCount = 0;

      for (const key of keys) {
        const cached = await get(`img_${key}`);
        if (cached) {
          loadedImages[key] = cached;
          loadedCount++;
          setProgress((loadedCount / keys.length) * 100);
        }
      }

      if (loadedCount === keys.length) {
        setImages(loadedImages);
        setLoading(false);
        return;
      }

      setImages({ ...loadedImages });

      const missingKeys = keys.filter(k => !loadedImages[k]);
      
      const generateImage = async (key: string) => {
        try {
          const { prompt, aspectRatio } = IMAGE_PROMPTS[key as keyof typeof IMAGE_PROMPTS];
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
              imageConfig: { aspectRatio }
            }
          });
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              loadedImages[key] = base64Data;
              await set(`img_${key}`, base64Data);
              break;
            }
          }
        } catch (e) {
          console.error(`Failed to generate ${key}:`, e);
          loadedImages[key] = 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800&auto=format&fit=crop';
        }
        loadedCount++;
        setProgress((loadedCount / keys.length) * 100);
        setImages({ ...loadedImages });
      };

      const limit = 2;
      for (let i = 0; i < missingKeys.length; i += limit) {
        const chunk = missingKeys.slice(i, i + limit);
        await Promise.all(chunk.map(generateImage));
      }
      
      setLoading(false);
    }
    loadImages();
  }, []);

  return { images, loading, progress };
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-6 mix-blend-difference text-white">
      <div className="font-serif text-3xl font-bold tracking-tighter">jeju dip</div>
      <div className="hidden md:flex gap-8 font-sans text-xs uppercase tracking-widest">
        <a href="#process" className="hover:opacity-70 transition-opacity">Process</a>
        <a href="#flavors" className="hover:opacity-70 transition-opacity">Flavors</a>
        <a href="#mission" className="hover:opacity-70 transition-opacity">Mission</a>
        <a href="#shop" className="hover:opacity-70 transition-opacity">Shop</a>
      </div>
    </nav>
  );
}

function Hero({ heroImg, heroBg, onOpenModal }: { heroImg?: string, heroBg?: string, onOpenModal: () => void }) {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-ink">
      {/* Background Image instead of Spline */}
      {heroBg ? (
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Jeju Dip Background" className="w-full h-full object-cover opacity-60" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-ink animate-pulse"></div>
      )}
      
      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-black/30 z-0 pointer-events-none"></div>

      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 pointer-events-none">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-7xl md:text-8xl lg:text-[11rem] leading-[0.85] text-white mix-blend-difference"
        >
          Sweet joy<br />
          <span className="italic">from Jeju</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 md:mt-24 flex flex-col md:flex-row md:items-center gap-6 md:gap-24 text-white mix-blend-difference"
        >
          <p className="font-sans font-light text-lg md:text-xl max-w-md leading-relaxed">
            버터베이스 쿠키에 제주 원물을 활용한 스프레드 디핑소스.<br/>
            다양한 조합의 재미와 먹는 즐거움을 선사합니다.
          </p>
          <button className="pointer-events-auto border border-white/30 rounded-full px-8 py-3 text-xs tracking-widest font-bold hover:bg-white hover:text-black transition-colors backdrop-blur-sm">
            브랜드 필름 보기
          </button>
        </motion.div>
      </div>

      {/* Floating Card */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute top-24 right-8 md:right-16 bg-cream p-4 w-64 shadow-2xl z-20 pointer-events-auto hidden md:block"
      >
        {heroImg ? (
          <img src={heroImg} alt="Cookie making" className="w-full h-40 object-cover mb-4" />
        ) : (
          <div className="w-full h-40 bg-ink/10 mb-4 animate-pulse"></div>
        )}
        <p className="font-sans text-xs text-ink mb-4 leading-relaxed">제주의 자연을 담은 수제 스프레드와 버터 쿠키 세트를 만나보세요.</p>
        <button onClick={onOpenModal} className="w-full bg-ink text-cream text-xs py-3 font-bold tracking-widest hover:bg-ink/80 transition-colors cursor-pointer">
          주문 예약하기
        </button>
      </motion.div>
    </section>
  );
}

function Process() {
  return (
    <section id="process" className="py-32 px-8 md:px-16 lg:px-24 bg-ink text-cream relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 mb-32">
          <h2 className="font-serif text-4xl md:text-5xl whitespace-nowrap">From butter</h2>
          <div className="flex-1 h-[1px] bg-cream/30 w-full md:w-auto relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cream/50"></div>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl italic whitespace-nowrap">to Jeju nature</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <p className="font-sans text-xl md:text-2xl font-light leading-relaxed text-cream/80">
              우리는 가장 완벽한 식감의 버터 쿠키를 굽고,<br/>
              제주의 햇살과 바람을 맞고 자란 원물로<br/>
              진하고 부드러운 스프레드를 만듭니다.
            </p>
          </div>
          <div className="flex justify-end items-end">
            <p className="font-sans text-sm uppercase tracking-widest text-cream/50 max-w-xs text-right leading-loose">
              We craft delicious combinations<br/>
              Without losing the natural essence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ingredients({ bgImg }: { bgImg?: string }) {
  return (
    <section className="py-40 px-8 md:px-16 lg:px-24 bg-earth text-cream relative">
      {/* Background texture simulation using a dark earthy image */}
      {bgImg && (
        <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: `url("${bgImg}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      )}
      
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <h2 className="font-serif text-5xl md:text-7xl leading-tight mb-8">
            Without <br/>
            <span className="italic text-3xl md:text-5xl opacity-80 block mt-4 leading-snug">
              artificial flavors<br/>
              preservatives<br/>
              compromises.
            </span>
          </h2>
        </div>
        <div className="flex-1 relative">
           <p className="font-sans text-lg md:text-xl font-light leading-relaxed text-cream/90 max-w-md">
              우도 땅콩의 고소함, 구좌 당근의 달콤함, 제주 말차의 쌉싸름함. 자연이 준 선물 그대로를 스프레드에 담았습니다.
            </p>
            
            <div className="mt-16 relative">
              <svg className="absolute -top-12 -left-12 w-24 h-24 text-cream/30" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4">
                <path d="M 100 0 Q 0 0 0 100" />
              </svg>
              <p className="font-sans text-sm uppercase tracking-widest text-cream/60 leading-loose">
                more flavor<br/>
                more fun<br/>
                more combinations
              </p>
            </div>
        </div>
      </div>
    </section>
  );
}

function Experience({ images }: { images: Record<string, string> }) {
  return (
    <section id="flavors" className="py-32 px-8 md:px-16 lg:px-24 bg-cream text-ink">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-center mb-32">
          <div className="flex-1">
            <h2 className="font-serif text-6xl md:text-8xl leading-none mb-8">
              Inspired by <br/>
              <span className="italic">Jeju's nature</span>
            </h2>
            <p className="font-sans text-lg max-w-md text-ink/70 leading-relaxed mb-8">
              제주가 품은 고유의 맛을 스프레드에 담아<br/>
              고소한 버터 쿠키와 완벽한 페어링을 제안합니다.
            </p>
            <button className="border border-ink/20 rounded-full px-8 py-3 text-xs tracking-widest font-bold hover:bg-ink hover:text-cream transition-colors cursor-pointer">
              제조 과정 보기
            </button>
          </div>
          <div className="flex-1">
            {images.natureJeju ? (
              <img src={images.natureJeju} alt="Jeju Nature" className="w-full aspect-[4/5] object-cover rounded-sm soft-edges" />
            ) : (
              <div className="w-full aspect-[4/5] bg-ink/10 animate-pulse rounded-sm soft-edges"></div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-40">
          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            {images.grid1 ? <img src={images.grid1} alt="Cookie" className="w-full aspect-square object-cover soft-edges" /> : <div className="w-full aspect-square bg-ink/10 animate-pulse soft-edges"></div>}
            {images.grid2 ? <img src={images.grid2} alt="Cookie" className="w-full aspect-square object-cover mt-12 soft-edges" /> : <div className="w-full aspect-square bg-ink/10 animate-pulse mt-12 soft-edges"></div>}
            {images.grid3 ? <img src={images.grid3} alt="Cookie" className="w-full aspect-square object-cover soft-edges" /> : <div className="w-full aspect-square bg-ink/10 animate-pulse soft-edges"></div>}
            {images.grid4 ? <img src={images.grid4} alt="Cookie" className="w-full aspect-square object-cover mt-12 soft-edges" /> : <div className="w-full aspect-square bg-ink/10 animate-pulse mt-12 soft-edges"></div>}
          </div>
          <div className="md:col-span-1"></div>
          <div className="md:col-span-5 text-left md:text-right mt-16 md:mt-0">
            <h2 className="font-serif text-6xl md:text-8xl leading-none mb-8">
              Real butter,<br/>
              <span className="italic">real flavor.</span>
            </h2>
            <p className="font-sans text-lg text-ink/70 mb-12 md:ml-auto max-w-sm leading-relaxed">
              찍어 먹고, 발라 먹고, 샌드해 먹는 재미.<br/>
              다양한 스프레드와 쿠키로 나만의 완벽한 한 입을 만들어보세요.
            </p>
            <button className="border border-ink/20 bg-cream rounded-full px-8 py-3 text-xs tracking-widest font-bold hover:bg-ink hover:text-cream transition-colors cursor-pointer">
              제품 자세히 보기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Press() {
  return (
    <section className="py-24 bg-cream border-t border-ink/10">
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
        <h2 className="font-serif text-5xl text-center mb-16">In the press</h2>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale">
          <div className="font-serif text-2xl font-bold tracking-tighter">FAST COMPANY</div>
          <div className="font-sans text-2xl font-black tracking-tighter">AXIOS</div>
          <div className="font-sans text-2xl font-bold">Bloomberg</div>
          <div className="font-serif text-2xl font-bold">The Guardian</div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-cream text-ink pt-32 pb-8 px-8 md:px-16 lg:px-24 border-t border-ink/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-32">
          <div>
            <ul className="space-y-3 font-sans text-xs uppercase tracking-widest text-ink/70">
              <li><a href="#" className="hover:text-ink">Home</a></li>
              <li><a href="#" className="hover:text-ink">Process</a></li>
              <li><a href="#" className="hover:text-ink">Foods</a></li>
              <li><a href="#" className="hover:text-ink">Mission</a></li>
              <li><a href="#" className="hover:text-ink">Journal</a></li>
              <li><a href="#" className="hover:text-ink">Contact</a></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-3 font-sans text-xs uppercase tracking-widest text-ink/70">
              <li><a href="#" className="hover:text-ink">LinkedIn</a></li>
              <li><a href="https://instagram.com/jejudip_official" target="_blank" rel="noreferrer" className="hover:text-ink">Instagram</a></li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-2 md:pl-16">
            <h3 className="font-sans text-xl mb-6 leading-relaxed">
              더 많은 소식이 궁금하신가요? 뉴스레터를 구독하고 새로운 맛과 팝업 스토어 소식을 가장 먼저 받아보세요.
            </h3>
            <button className="bg-ink text-cream px-8 py-3 text-xs font-bold tracking-widest hover:bg-ink/80 transition-colors cursor-pointer">
              구독하기
            </button>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-16 w-full overflow-hidden">
          <h1 className="font-serif text-[16vw] leading-none tracking-tighter lowercase text-ink whitespace-nowrap">
            jeju dip
          </h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-xs font-sans text-ink/50 tracking-widest">
          <div className="flex gap-6 mb-4 md:mb-0 uppercase">
            <a href="#" className="hover:text-ink">Press Kit</a>
            <a href="#" className="hover:text-ink">Terms of Service</a>
            <a href="#" className="hover:text-ink">Privacy Policy</a>
          </div>
          <div className="flex gap-6 mb-4 md:mb-0">
            <span>대표: 박미소</span>
            <a href="mailto:miso@jejudip.kr" className="hover:text-ink">miso@jejudip.kr</a>
          </div>
          <div className="uppercase">©Jeju Dip 2026.</div>
        </div>
      </div>
    </footer>
  );
}

function ReservationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset success state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setFormData({ name: '', phone: '', email: '' });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || 'https://script.google.com/macros/s/AKfycbwd4KdWLfedKLS_uN4wewgF3AN_uhdNt-J0qrA2nkiaP8VR42ZWEHLXlYQdt3CHHmD0/exec';

    try {
      const params = new URLSearchParams({
        name: formData.name,
        phone: formData.phone,
        email: formData.email
      });
      
      const urlWithParams = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}${params.toString()}`;

      // 1. 먼저 데이터를 백그라운드에서 전송 시작 (await 하지 않음)
      fetch(urlWithParams, {
        method: 'GET',
        mode: 'no-cors',
      }).catch(err => console.error('Background submission error:', err));

      // 2. 사용자에게는 즉시 '처리 중' 느낌을 주기 위해 아주 짧은 대기 후 바로 성공 화면 표시
      await new Promise(resolve => setTimeout(resolve, 600));
      setIsSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('데이터 전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-cream w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-ink/50 hover:text-ink transition-colors cursor-pointer z-10">
              <X size={24} strokeWidth={1.5} />
            </button>

            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h2 className="font-serif text-4xl mb-2">Reserve Your Box</h2>
                  <p className="font-sans text-sm text-ink/70 mb-8">제주 딥 쿠키 & 스프레드 세트 사전 예약을 신청해주세요.</p>
                  
                  <form className="space-y-5 font-sans" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-ink/80">이름</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-transparent border border-ink/20 rounded-none px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors" 
                        placeholder="홍길동" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-ink/80">연락처</label>
                      <input 
                        type="tel" 
                        required 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-transparent border border-ink/20 rounded-none px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors" 
                        placeholder="010-0000-0000" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-ink/80">이메일</label>
                      <input 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-transparent border border-ink/20 rounded-none px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors" 
                        placeholder="hello@example.com" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-ink text-cream py-4 mt-8 text-xs font-bold tracking-widest hover:bg-ink/80 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? '접수 중...' : '예약 신청 완료하기'}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <Check size={40} strokeWidth={2.5} />
                  </div>
                  <h2 className="font-serif text-4xl mb-4">Thank You!</h2>
                  <p className="font-sans text-sm text-ink/70 mb-8 leading-relaxed">
                    예약 신청이 성공적으로 완료되었습니다.<br/>
                    입력하신 연락처로 곧 안내 메일을 보내드릴게요.
                  </p>
                  <button 
                    onClick={onClose}
                    className="bg-ink text-cream px-12 py-3 text-xs font-bold tracking-widest hover:bg-ink/80 transition-colors cursor-pointer"
                  >
                    닫기
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const { images, loading, progress } = useAIGeneratedImages();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream selection:bg-ink selection:text-cream">
      <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-cream flex flex-col items-center justify-center text-ink"
          >
            <div className="font-serif text-4xl mb-8">Baking cookies...</div>
            <div className="w-64 h-1 bg-ink/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-ink"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
            <div className="mt-4 font-sans text-xs uppercase tracking-widest text-ink/50">
              Generating AI Images ({Math.round(progress)}%)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <Hero heroImg={images.hero} heroBg={images.heroBg} onOpenModal={() => setIsModalOpen(true)} />
      <Process />
      <Ingredients bgImg={images.bgTexture} />
      <Experience images={images} />
      <Press />
      <Footer />
    </div>
  );
}
