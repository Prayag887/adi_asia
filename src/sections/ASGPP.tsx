import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';
import { GraduationCap, ArrowRight, BookOpen, Users, Award } from 'lucide-react';

const programs = [
  { name: 'Governance', icon: BookOpen },
  { name: 'Public Policy', icon: Users },
  { name: 'Peace Studies', icon: Award },
];

export default function ASGPP() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { containerRef: contentRef, getItemStyle } = useStaggerAnimation(2, 0.3);
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section 
      id="asgpp" 
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

      {/* Decorative Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        <svg className="absolute w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="geometric" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <polygon 
                points="60,15 105,60 60,105 15,60" 
                fill="none" 
                stroke="#b8946a" 
                strokeWidth="0.5"
              />
              <circle cx="60" cy="60" r="2" fill="#b8946a" fillOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric)" />
        </svg>
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-14 lg:mb-18">
          {/* Icon/Badge */}
          <div 
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-10 transition-all duration-700 ${
              headerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
            style={{ 
              background: 'rgba(184, 148, 106, 0.15)',
              border: '1px solid rgba(184, 148, 106, 0.35)'
            }}
          >
            <GraduationCap className="w-10 h-10" style={{ color: '#b8946a' }} />
          </div>
          
          {/* Label */}
          <span 
            className={`section-label block transition-all duration-700 delay-200 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Education Initiative
          </span>
          
          {/* Title */}
          <h2 
            className={`font-cormorant text-4xl sm:text-5xl lg:text-[56px] text-[#f8f6f1] font-semibold mt-5 mb-5 leading-tight transition-all duration-700 delay-400 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            The Asian School of Governance
            <br />
            <span style={{ color: '#b8946a' }}>and Public Policy</span>
          </h2>
          
          {/* Subtitle */}
          <p 
            className={`font-playfair text-2xl sm:text-[28px] text-[#f8f6f1]/70 transition-all duration-700 delay-500 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Bridging Theory and Practice
          </p>
        </div>
        
        {/* Description Paragraphs */}
        <div 
          ref={contentRef}
          className="text-center max-w-3xl mx-auto mb-14 lg:mb-18"
        >
          <p 
            className="font-inter text-lg text-[#f8f6f1]/70 leading-relaxed mb-6"
            style={getItemStyle(0)}
          >
            The Asian School of Governance and Public Policy (ASGPP) is ADI&apos;s initiative 
            to translate practical, field-based experience into rigorous academic learning. 
            Drawing on ADI&apos;s work in peacebuilding, digital governance, and public health, 
            ASGPP provides students with an opportunity to engage directly with real-world 
            challenges in governance and policy.
          </p>
          <p 
            className="font-inter text-lg text-[#f8f6f1]/70 leading-relaxed"
            style={getItemStyle(1)}
          >
            The curriculum is designed to bridge theory and practice, encouraging critical 
            thinking, applied research, and a nuanced understanding of the social, political, 
            and institutional contexts shaping public life in Asia.
          </p>
        </div>
        
        {/* Programs Card */}
        <div 
          ref={cardRef}
          className={`rounded-2xl p-10 sm:p-14 lg:p-18 max-w-3xl mx-auto transition-all duration-1000 ${
            cardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ 
            backgroundColor: 'rgba(248, 246, 241, 0.97)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)'
          }}
        >
          <h3 
            className="font-cormorant text-3xl sm:text-4xl font-semibold text-center mb-3"
            style={{ color: '#0f1e33' }}
          >
            Programs Offered
          </h3>
          
          <p 
            className="font-inter text-lg text-center mb-10"
            style={{ color: '#4a5568' }}
          >
            Six-Month Graduate Diploma & Master&apos;s Programs
          </p>
          
          {/* Program List */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {programs.map((program, index) => {
              const Icon = program.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 px-6 py-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(15, 30, 51, 0.04)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#9a7b52' }} />
                  <span 
                    className="font-inter text-lg font-medium"
                    style={{ color: '#0f1e33' }}
                  >
                    {program.name}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Scholarship Note */}
          <p 
            className="font-inter text-base text-center mb-10"
            style={{ color: '#4a5568' }}
          >
            Selective cohort | Full scholarships for deserving candidates
          </p>
          
          {/* Mission Statement */}
          <p 
            className="font-inter text-base text-center leading-relaxed mb-12 max-w-2xl mx-auto"
            style={{ color: '#4a5568' }}
          >
            By linking academic learning with practical engagement, ASGPP seeks to cultivate 
            a new generation of practitioners and thinkers capable of designing innovative 
            solutions, promoting inclusive governance, and advancing sustainable peace across 
            the region.
          </p>
          
          {/* CTA Button */}
          <div className="text-center">
            <a 
              href="#contact" 
              className="inline-flex items-center gap-2 btn-primary group"
            >
              Learn About ASGPP
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
