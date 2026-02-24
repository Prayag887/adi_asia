import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';

const workCards = [
  {
    country: 'Nepal',
    title: 'Digital Governance & Public Health',
    description: 'In Nepal, ADI focuses on digital governance and public health initiatives that reinforce accountability, service delivery, and social trust. We work alongside public institutions to strengthen governance strategies and ensure reforms remain responsive to local realities.',
  },
  {
    country: 'Myanmar',
    title: 'Dialogue & Cooperation',
    description: 'We work with diverse groups to encourage cooperative practices and sustained dialogue across lines of division, creating spaces for constructive engagement beyond political polarization.',
  },
  {
    country: 'Afghanistan',
    title: 'Community Health Access',
    description: 'Our locally based teams support community-level efforts to facilitate access to essential health services, responding to immediate needs while contributing to longer-term social stability.',
  },
];

function FlowingLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg 
        className="absolute w-full h-full opacity-[0.08]"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b8946a" stopOpacity="0" />
            <stop offset="50%" stopColor="#b8946a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#b8946a" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path 
          d="M0,400 Q360,200 720,400 T1440,400" 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="1"
          className="animate-wave"
          style={{ animationDuration: '30s' }}
        />
        <path 
          d="M0,500 Q360,300 720,500 T1440,500" 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="0.5"
          className="animate-wave"
          style={{ animationDuration: '35s', animationDelay: '5s' }}
        />
      </svg>
    </div>
  );
}

export default function OurWork() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { containerRef: cardsRef, getItemStyle } = useStaggerAnimation(workCards.length, 0.2);

  return (
    <section 
      id="our-work" 
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a1525 0%, #0f1e33 40%, #0a1525 100%)' }}
    >
      {/* Subtle Texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <FlowingLines />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a1525]/50" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          <span 
            className={`section-label transition-all duration-700 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Our Work
          </span>
          <h2 
            className={`font-cormorant text-4xl sm:text-5xl lg:text-[54px] text-[#f8f6f1] font-semibold mt-5 mb-8 transition-all duration-700 delay-200 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Context-Specific Initiatives
            <br />
            <span style={{ color: '#b8946a' }}>Across Asia</span>
          </h2>
          <p 
            className={`font-inter text-lg sm:text-xl text-[#f8f6f1]/70 leading-relaxed transition-all duration-700 delay-400 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            We undertake initiatives that address the social, institutional, and relational 
            dimensions of conflict. Our work emphasizes practical engagement—supporting processes 
            that reduce mistrust, strengthen cooperation, and create conditions for peaceful 
            interaction among divided actors.
          </p>
        </div>
        
        {/* Geographic Work Cards */}
        <div 
          ref={cardsRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {workCards.map((card, index) => (
            <div
              key={index}
              className="glass-card group"
              style={getItemStyle(index)}
            >
              {/* Country Label */}
              <span 
                className="font-inter text-sm tracking-[2.5px] uppercase"
                style={{ color: '#b8946a' }}
              >
                {card.country}
              </span>
              
              {/* Card Title */}
              <h3 
                className="font-cormorant text-2xl sm:text-3xl text-[#f8f6f1] font-semibold mt-5 mb-5 group-hover:text-[#b8946a] transition-colors duration-300"
              >
                {card.title}
              </h3>
              
              {/* Card Description */}
              <p className="font-inter text-base text-[#f8f6f1]/70 leading-relaxed">
                {card.description}
              </p>
              
              {/* Decorative Line */}
              <div 
                className="mt-8 h-px w-0 group-hover:w-full transition-all duration-500"
                style={{ background: 'linear-gradient(to right, rgba(184, 148, 106, 0.5), transparent)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
