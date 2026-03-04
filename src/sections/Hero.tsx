import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = Math.min(60, Math.floor(window.innerWidth / 25));
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      if (frameCount % 2 === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const particles = particlesRef.current;

        particles.forEach((particle, i) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(193, 154, 107, ${particle.opacity})`;
          ctx.fill();

          if (i % 4 === 0) {
            particles.slice(i + 1).forEach((other, j) => {
              if (j % 3 !== 0) return;
              const dx = particle.x - other.x;
              const dy = particle.y - other.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < 140) {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(other.x, other.y);
                ctx.strokeStyle = `rgba(193, 154, 107, ${0.12 * (1 - distance / 140)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            });
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

function ElegantBackgroundAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Slow drifting orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          top: '-20%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(193, 154, 107, 0.3) 0%, transparent 70%)',
          animation: 'drift-1 40s ease-in-out infinite'
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          bottom: '-15%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(44, 95, 95, 0.4) 0%, transparent 70%)',
          animation: 'drift-2 50s ease-in-out infinite'
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          top: '40%',
          left: '20%',
          background: 'radial-gradient(circle, rgba(193, 154, 107, 0.2) 0%, transparent 70%)',
          animation: 'drift-3 35s ease-in-out infinite'
        }}
      />

      {/* Subtle geometric rings */}
      <div
        className="absolute w-96 h-96 rounded-full border border-gold/5"
        style={{
          top: '20%',
          right: '15%',
          animation: 'rotate-slow 60s linear infinite'
        }}
      />
      <div
        className="absolute w-72 h-72 rounded-full border border-white/5"
        style={{
          top: '25%',
          right: '20%',
          animation: 'rotate-slow-reverse 80s linear infinite'
        }}
      />

      {/* Fine line accents */}
      <div
        className="absolute w-px h-40 bg-gradient-to-b from-transparent via-gold/20 to-transparent"
        style={{ top: '15%', left: '10%', animation: 'pulse-opacity 8s ease-in-out infinite' }}
      />
      <div
        className="absolute w-px h-32 bg-gradient-to-b from-transparent via-gold/15 to-transparent"
        style={{ top: '60%', right: '8%', animation: 'pulse-opacity 10s ease-in-out infinite', animationDelay: '3s' }}
      />
      <div
        className="absolute h-px w-24 bg-gradient-to-r from-transparent via-gold/15 to-transparent"
        style={{ top: '35%', left: '5%', animation: 'pulse-opacity 12s ease-in-out infinite', animationDelay: '5s' }}
      />
    </div>
  );
}

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f1e33 0%, #1a2942 40%, #152238 100%)' }}>
      {/* Background Elements */}
      <ParticleBackground />
      <ElegantBackgroundAnimation />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f1e33]/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100svh] pt-28 pb-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Main Content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Motto */}
          <p
            className={`font-cinzel text-[10px] tracking-[0.35em] text-gold uppercase mb-10 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            style={{ textShadow: '0 2px 20px rgba(193, 154, 107, 0.3)' }}
          >
            Dialogue · Peace · Development · Education
          </p>

          {/* Hero Title */}
          <h1
            className={`font-cormorant text-5xl sm:text-6xl lg:text-hero text-ivory font-bold leading-tight mb-10 transition-all duration-1000 delay-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            Building Lasting Peace
            <br />
            <span className="text-gold" style={{ textShadow: '0 2px 30px rgba(193, 154, 107, 0.25)' }}>Through Trusted Dialogue</span>
          </h1>

          {/* Hero Description */}
          <p
            className={`font-garamond text-lg sm:text-xl text-ivory/80 max-w-2xl mx-auto leading-loose mb-14 transition-all duration-1000 delay-1100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            An independent platform advancing peace across Asia through mediation,
            sustained engagement, and context-driven solutions. We create trusted spaces
            for constructive dialogue away from political pressure.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-5 transition-all duration-1000 delay-1400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            <a href="#our-work" className="btn-primary">
              Our Work
            </a>
            <a href="#about" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToAbout}
          className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ivory/50 hover:text-gold transition-all duration-500 cursor-pointer group ${isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          aria-label="Scroll to learn more"
        >
          <span className="font-cinzel text-[9px] tracking-[0.3em] uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce-subtle group-hover:text-gold transition-colors" />
        </button>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.05); }
          50% { transform: translate(-10px, 30px) scale(0.95); }
          75% { transform: translate(-20px, -10px) scale(1.02); }
        }
        @keyframes drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 20px) scale(1.03); }
          66% { transform: translate(20px, -30px) scale(0.98); }
        }
        @keyframes drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 10px) scale(1.05); }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotate-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </section>
  );
}
