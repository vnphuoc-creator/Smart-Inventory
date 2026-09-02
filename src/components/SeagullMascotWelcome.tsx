import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, Volume2, VolumeX, Heart, Plane, ShieldCheck, Sun, Moon } from 'lucide-react';
import seagullWelcoming from '../assets/images/danang_seagull_welcoming_1788356485133.jpg';
import seagullCheering from '../assets/images/danang_seagull_cheering_1788356501760.jpg';
import seagullWaving from '../assets/images/danang_seagull_waving_1788356538939.jpg';

export interface SeagullMascotWelcomeProps {
  userName: string;
  userRole?: string;
  className?: string;
  variant?: 'banner' | 'compact' | 'badge';
  showSpeechBubble?: boolean;
}

const SEAGULL_EXPRESSIONS = [
  { id: 'welcoming', img: seagullWelcoming, emotion: 'vui vẻ' },
  { id: 'waving', img: seagullWaving, emotion: 'hân hoan' },
  { id: 'cheering', img: seagullCheering, emotion: 'nhiệt huyết' },
];

export const SeagullMascotWelcome: React.FC<SeagullMascotWelcomeProps> = ({
  userName,
  userRole,
  className = '',
  variant = 'banner',
  showSpeechBubble = true,
}) => {
  const [currentExpIndex, setCurrentExpIndex] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [speechIndex, setSpeechIndex] = useState(0);
  const [particles, setParticles] = useState<{ id: number; icon: string; left: number }[]>([]);

  // Time-of-day greeting generator
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buổi sáng tốt lành';
    if (hour >= 12 && hour < 18) return 'Buổi chiều hiệu quả';
    return 'Buổi tối an toàn';
  };

  const timeGreeting = getGreetingTime();
  const firstName = userName ? userName.trim().split(' ').slice(-1)[0] : 'Bạn';

  // Professional and welcoming dynamic messages for technical staff
  const speechMessages = [
    `Chào mừng ${userName} đến với hệ thống Quản lý Vật tư Kho Đội Điện Nước Công Trình! ✈️`,
    `Chúc ${firstName} một ca trực an toàn, kiểm soát xuất nhập tồn chính xác 100%! ⚡💧`,
    `Hệ thống luôn sẵn sàng hỗ trợ tra cứu, lập phiếu và đối soát vật tư ca trực. 🌟`,
    `Đảm bảo cung ứng vật tư nhanh chóng phục vụ an toàn kỹ thuật Cảng HKQT Đà Nẵng! 🛫`,
    `Chúc ${firstName} một ngày làm việc hiệu quả và tràn đầy năng lượng! 🎉`,
  ];

  // Rotate expressions automatically every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentExpIndex((prev) => (prev + 1) % SEAGULL_EXPRESSIONS.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleMascotClick = () => {
    setIsJumping(true);
    // Next expression
    setCurrentExpIndex((prev) => (prev + 1) % SEAGULL_EXPRESSIONS.length);
    // Next speech message
    setSpeechIndex((prev) => (prev + 1) % speechMessages.length);

    // Spawn floating fun particles
    const icons = ['✨', '🎉', '✈️', '💙', '⭐', '⚡'];
    const newParticles = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: 20 + Math.random() * 60,
    }));
    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setIsJumping(false);
    }, 850);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 2000);
  };

  const currentMascot = SEAGULL_EXPRESSIONS[currentExpIndex];

  if (variant === 'compact') {
    return (
      <div
        className={`relative inline-flex items-center justify-center cursor-pointer group ${className}`}
        onClick={handleMascotClick}
        title="Linh vật chào đón - Nhấn để tương tác!"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-cyan-400/80 shadow-md shadow-cyan-500/20 bg-slate-950 transition-transform group-hover:scale-110">
          <img
            src={currentMascot.img}
            alt="Chào đón thành viên"
            className="w-full h-full object-cover animate-seagull-wave"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-3.5 group select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Interactive Particles on Click */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute z-50 text-base pointer-events-none transition-all duration-1000 transform -translate-y-12 opacity-0 animate-in fade-in zoom-in"
          style={{ left: `${p.left}%`, top: '-10px' }}
        >
          {p.icon}
        </span>
      ))}

      {/* Mascot Animated Avatar Frame - Clean, Professional without text overlay */}
      <div
        onClick={handleMascotClick}
        className={`relative cursor-pointer transition-transform duration-300 ${
          isJumping ? 'animate-seagull-spin-jump' : isHovered ? 'scale-105' : 'animate-seagull-float'
        }`}
        title="Chào mừng bạn đến với ca trực! Nhấn để tương tác"
      >
        {/* Soft Glowing Aura */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500/40 via-blue-600/40 to-amber-400/40 rounded-2xl blur-sm animate-seagull-glow" />

        {/* Mascot Avatar Container - Pure Clean Image Only */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-400 via-blue-500 to-amber-300 shadow-lg shadow-blue-950/60 overflow-hidden ring-2 ring-white/20">
          <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-950 relative">
            <img
              src={currentMascot.img}
              alt="Chào mừng thành viên"
              className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Active Online / Cheerful Indicator */}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full flex items-center justify-center text-[8px] shadow-sm animate-bounce">
          ⚡
        </span>
      </div>

      {/* Greeting Text Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="dashboard-greeting-title text-base sm:text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <span>Xin chào, {userName}</span>
            <span className="text-sm sm:text-base animate-seagull-wave inline-block origin-bottom-right">
              👋
            </span>
          </h1>

          <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 shadow-sm animate-in fade-in">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            {timeGreeting}
          </span>
        </div>

        <p className="dashboard-greeting-subtitle text-xs sm:text-sm text-slate-300 font-medium mt-0.5 leading-relaxed">
          Hệ thống Quản lý Vật tư Kho Đội Điện Nước Công Trình (DOIDNCT) &bull; Cảng HKQT Đà Nẵng
        </p>

        {/* Interactive Speech Bubble */}
        {showSpeechBubble && (
          <div
            onClick={handleMascotClick}
            className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/70 rounded-xl px-3 py-1.5 text-xs text-cyan-100 shadow-md cursor-pointer transition-all duration-200 hover:shadow-cyan-500/10 hover:shadow-lg group/bubble"
          >
            <span className="text-amber-300 text-sm animate-pulse">💬</span>
            <span className="font-medium text-[11.5px] text-cyan-100 group-hover/bubble:text-white transition-colors">
              {speechMessages[speechIndex % speechMessages.length]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeagullMascotWelcome;
