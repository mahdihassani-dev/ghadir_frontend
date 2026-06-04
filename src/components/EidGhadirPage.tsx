import React, { useState, useRef, useEffect } from 'react';
import { 
  ScrollText, 
  Loader2, 
  RefreshCw, 
  PauseCircle, 
  PlayCircle, 
  Share2, 
  Quote, 
  BookOpen 
} from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface Hadith {
  persian_text: string;
  arabic_text: string;
}

const EidGhadirPage = () => {
  const [currentHadith, setCurrentHadith] = useState<Hadith | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false); // اضافه شدن حالت لودینگ برای دکمه شیر
  const [showHadith, setShowHadith] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [pausedManually, setPausedManually] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hadithRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null); // Ref جدید برای گرفتن عکس

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.2;
    }
  }, []);

  const fetchHadith = async (): Promise<Hadith> => {
    const response = await fetch('http://127.0.0.1:8000/api/hadith/random/');
    if (!response.ok) throw new Error("دریافت حدیث با مشکل مواجه شد");
    const data = await response.json();
    
    if (data?.arabic_text && data?.persian_text) return data;
    
    throw new Error("داده‌ای دریافت نشد");
  };

  const handleScrollClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setShowHadith(false);

    try {
      const hadith = await fetchHadith();
      setCurrentHadith(hadith);

      setTimeout(() => setShowHadith(true), 150);

      toast.success('حدیث جدیدی دریافت شد');

      const audio = audioRef.current;
      if (audio && audio.paused && !pausedManually) {
        await audio.play();
        setIsAudioPlaying(true);
      }

      setTimeout(() => {
        hadithRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    } catch (error) {
      console.error('Error fetching hadith:', error);
      toast.error('دریافت حدیث با مشکل مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsAudioPlaying(true);
      setPausedManually(false);
    } else {
      audio.pause();
      setIsAudioPlaying(false);
      setPausedManually(true);
    }
  };

  const handleShare = async () => {
    if (!currentHadith) return;
    setIsSharing(true);

    const siteUrl = window.location.href;
    const captionText = `به مناسبت عید غدیر 🌿\n\nتو هم یک حدیث بخوان:\n${siteUrl}`;
    const fullTextFallback = `به مناسبت عید غدیر 🌿\nروحت را با حدیثی از مولای متقیان سیراب کن:\n\n"${currentHadith.arabic_text}"\n\n${currentHadith.persian_text}\n\nتو هم یک حدیث بخوان:\n${siteUrl}`;

    try {
      // تلاش برای ساخت عکس از کارت حدیث
      if (captureRef.current) {
        const canvas = await html2canvas(captureRef.current, {
          scale: 2, // کیفیت بالا برای عکس
          useCORS: true,
          backgroundColor: '#fdfbf7', // رنگ پس‌زمینه در صورت شفاف بودن
        });

        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'hadith-ghadir.png', { type: 'image/png' });

            // بررسی اینکه آیا دستگاه قابلیت اشتراک‌گذاری عکس رو داره؟ (گوشی‌ها)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'حدیثی از حضرت علی (ع)',
                text: captionText,
                files: [file]
              });
              toast.success('آماده اشتراک‌گذاری...');
              setIsSharing(false);
              return;
            }
          }
          // اگر نتونست عکس رو شیر کنه، میره سراغ کپی کردن متن
          fallbackToTextShare(fullTextFallback);
        }, 'image/png');
      } else {
        fallbackToTextShare(fullTextFallback);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      fallbackToTextShare(fullTextFallback);
    }
  };

  // تابعی برای مواقعی که قابلیت اشتراک‌گذاری عکس نیست (مثل کامپیوتر)
  const fallbackToTextShare = async (textToShare: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'حدیثی از حضرت علی (ع)',
          text: textToShare,
        });
        toast.success('منوی اشتراک‌گذاری باز شد');
      } catch (error) {
        // کاربر ممکنه منو رو بسته باشه
      }
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        toast.success('متن حدیث و لینک سایت در کلیپ‌بورد کپی شد');
      } catch (err) {
        toast.error('خطا در کپی کردن متن');
      }
    }
    setIsSharing(false);
  };

  return (
    <div className="min-h-screen manuscript-bg overflow-hidden flex flex-col justify-between py-12">
      <audio ref={audioRef} src="/audio/ghadir-music.mp3" preload="auto" loop />

      <div className="container mx-auto px-4 max-w-4xl flex-grow flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-islamic-gold-700 mb-4 persian-text drop-shadow-sm">
            عید غدیر خم مبارک
          </h1>
          <h2 className="text-xl md:text-3xl text-manuscript-800 persian-text font-medium opacity-90">
            روحت را با حدیثی از مولای متقیان سیراب کن
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center space-y-12">
          {/* Scroll Button */}
          <div className="relative group">
            <button
              onClick={handleScrollClick}
              disabled={isLoading}
              className={`
                ancient-scroll relative z-10
                p-8 md:p-12 rounded-2xl
                transition-all duration-500 ease-out
                hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]
                hover:-translate-y-1
                focus:outline-none focus:ring-4 focus:ring-islamic-gold-300
                disabled:opacity-60 disabled:cursor-not-allowed
                disabled:hover:transform-none disabled:hover:shadow-none
              `}
            >
              <div className="flex flex-col items-center space-y-4">
                {isLoading ? (
                  <Loader2 className="w-16 h-16 text-islamic-gold-600 animate-spin" />
                ) : (
                  <ScrollText className="w-16 h-16 text-islamic-gold-600 transition-transform duration-300 group-hover:scale-110" />
                )}

                <div className="text-center persian-text">
                  <p className="text-xl md:text-2xl font-semibold text-manuscript-900 mb-2">
                    {isLoading ? 'در حال گشودن طومار...' : 'برای دریافت حدیث کلیک کنید'}
                  </p>
                  <p className="text-sm md:text-base text-manuscript-600">
                    {isLoading ? 'اندکی تأمل...' : 'نامه‌ای از گنجینه حکمت'}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Hadith Display Card */}
          {showHadith && currentHadith && (
            <div
              ref={hadithRef}
              className="w-full max-w-3xl transition-all duration-700 ease-out transform opacity-100 translate-y-0 relative animate-fade-in"
            >
              {/* Audio Control Button (بیرون از کادر عکس قرار دادیم که تو عکس نیفته) */}
              <div className="absolute -top-12 right-0 z-20">
                <button
                  onClick={toggleAudio}
                  className="text-islamic-gold-600 hover:text-islamic-gold-800 hover:scale-110 transition-all duration-300 bg-white/60 rounded-full p-2 shadow-sm"
                  title={isAudioPlaying ? 'توقف موسیقی' : 'پخش موسیقی'}
                >
                  {isAudioPlaying ? (
                    <PauseCircle className="w-6 h-6" />
                  ) : (
                    <PlayCircle className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* این همون بخشیه که به عکس تبدیل میشه */}
              <div 
                ref={captureRef}
                className="relative islamic-border bg-gradient-to-b from-white/95 to-amber-50/95 backdrop-blur-md p-8 md:p-12 rounded-2xl shadow-2xl border border-islamic-gold-300/50"
              >
                
                {/* Decorative Quotes */}
                <div className="absolute top-6 right-6 text-islamic-gold-200 opacity-40 pointer-events-none">
                  <Quote size={80} className="rotate-180" />
                </div>

                {/* Texts Wrapper */}
                <div className="relative z-10 flex flex-col items-center pt-4">
                  
                  {/* Arabic Text */}
                  <div className="mb-6 px-4 w-full text-center">
                    <p 
                      dir="rtl" 
                      className="text-2xl md:text-4xl leading-relaxed md:leading-loose text-slate-800 font-bold arabic-text drop-shadow-sm"
                    >
                      {currentHadith.arabic_text}
                    </p>
                  </div>

                  {/* Decorative Divider */}
                  <div className="flex items-center justify-center w-full my-6 opacity-70">
                    <div className="w-1/4 h-px bg-gradient-to-l from-transparent to-islamic-gold-500"></div>
                    <BookOpen className="mx-4 text-islamic-gold-600 w-6 h-6 md:w-8 md:h-8" />
                    <div className="w-1/4 h-px bg-gradient-to-r from-transparent to-islamic-gold-500"></div>
                  </div>

                  {/* Persian Text */}
                  <div className="mb-6 px-4 w-full text-center">
                    <p 
                      dir="rtl" 
                      className="text-lg md:text-xl leading-relaxed text-slate-700 persian-text font-medium"
                    >
                      {currentHadith.persian_text}
                    </p>
                  </div>
                  
                  {/* واترمارک کوچیک که فقط تو عکس دیده بشه قشنگه */}
                  <div className="text-center mt-4 border-t border-islamic-gold-200/50 pt-4 w-full">
                     <p className="text-xs text-islamic-gold-600 persian-text opacity-70">عید غدیر مبارک - یک حدیث سهم شما</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons (بیرون از محدوده عکس قرار دادم تا تو تصویر نیفتن) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full mt-6">
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-persian disabled:opacity-70"
                >
                  {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                  <span>{isSharing ? 'در حال آماده‌سازی...' : 'نشر حکمت'}</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center pb-8 animate-fade-in">
        <p className="text-base md:text-lg text-manuscript-700 persian-text opacity-90 font-medium">
          "أنا مدینة العلم و علی بابها"
        </p>
        <p className="text-sm md:text-base text-manuscript-600 persian-text mt-2 opacity-75">
          من شهر علم هستم و علی دروازه آن
        </p>
      </div>
    </div>
  );
};

export default EidGhadirPage;