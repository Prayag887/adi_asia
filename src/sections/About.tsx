import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';
import { Network, MessageCircle, TreePine } from 'lucide-react';

const statsCards = [
  {
    icon: Network,
    title: 'Regional Reach',
    description: 'Trusted presence across Asia with local teams embedded in communities',
  },
  {
    icon: MessageCircle,
    title: 'Quiet Diplomacy',
    description: 'Discreet forums for constructive dialogue beyond public pressure',
  },
  {
    icon: TreePine,
    title: 'Local Context',
    description: 'Solutions grounded in regional knowledge and practical realities',
  },
];

const aboutParagraphs = [
  'Asia Dialogue Initiative (ADI) is an independent platform dedicated to advancing peace through dialogue, mediation, and sustained engagement across Asia. We provide trusted spaces for quiet diplomacy, enabling constructive conversations away from public and political pressure.',
  'ADI supports discreet dialogue forums, conflict mediation, and relationship-building among political actors, policymakers, civil society, and community leaders. Our work is grounded in regional knowledge and local context, with an emphasis on discretion, patience, and practical outcomes rather than externally imposed solutions.',
  'We approach peace-building as a long-term process that requires trust, inclusion, and responsiveness to local realities. Alongside dialogue and mediation, ADI engages in sectoral initiatives that strengthen social cohesion and institutional resilience.',
  'We are based in Kathmandu, Nepal with local teams in the countries we work.',
];

export default function About() {
  const { ref: sectionRef } = useScrollAnimation({ threshold: 0.1 });
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.3 });
  const { containerRef: paragraphsRef, getItemStyle } = useStaggerAnimation(aboutParagraphs.length, 0.2);
  const { containerRef: cardsRef, getItemStyle: getCardStyle } = useStaggerAnimation(statsCards.length, 0.15);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-32 lg:py-40 overflow-hidden"
      style={{ backgroundColor: '#faf9f6' }}
    >
      {/* Premium Grain Texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Elegant Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left gradient orb */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full opacity-[0.04] blur-3xl"
          style={{
            top: '-20%',
            left: '-20%',
            background: 'radial-gradient(circle, #0f1e33 0%, transparent 65%)'
          }}
        />
        {/* Bottom right gradient orb */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.035] blur-3xl"
          style={{
            bottom: '-15%',
            right: '-15%',
            background: 'radial-gradient(circle, #b8946a 0%, transparent 65%)'
          }}
        />

        {/* Refined accent lines with gradient */}
        <div
          className="absolute w-0.5 h-32 bg-gradient-to-b from-transparent via-[#b8946a]/20 to-transparent blur-[0.5px]"
          style={{ top: '20%', left: '5%' }}
        />
        <div
          className="absolute w-0.5 h-24 bg-gradient-to-b from-transparent via-[#0f1e33]/12 to-transparent blur-[0.5px]"
          style={{ bottom: '25%', right: '7%' }}
        />

        {/* Subtle horizontal dividers */}
        <div
          className="absolute w-40 h-px bg-gradient-to-r from-transparent via-[#b8946a]/15 to-transparent"
          style={{ top: '35%', left: '10%' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid lg:grid-cols-5 gap-20 lg:gap-24 items-start">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3">
            {/* Premium Section Label */}
            <div
              ref={titleRef}
              className={`transition-all duration-1000 ease-out ${
                titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="inline-flex items-center gap-3 mb-2">
                <div className="w-8 h-px bg-gradient-to-r from-[#b8946a]/40 to-transparent" />
                <span
                  className="font-inter text-xs font-medium tracking-[0.2em] uppercase"
                  style={{ color: '#b8946a' }}
                >
                  About ADI
                </span>
              </div>
            </div>

            {/* Premium Section Title */}
            <h2
              className={`font-playfair text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight mt-6 mb-12 transition-all duration-1000 delay-150 ease-out ${
                titleVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
              style={{ color: '#0f1e33' }}
            >
              Independent. Regional.
              <br />
              <span className="font-normal">Grounded in Local Context.</span>
            </h2>

            {/* Premium Body Content */}
            <div ref={paragraphsRef} className="space-y-7 max-w-2xl">
              {aboutParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="font-inter text-[15px] leading-[1.8] tracking-tight"
                  style={{
                    color: '#3a4556',
                    ...getItemStyle(index)
                  }}
                >
                  {paragraph}
                </p>
              ))}

              {/* Premium Signature Element */}
              <div
                className="pt-8 mt-2 transition-all duration-700"
                style={getItemStyle(aboutParagraphs.length)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-px bg-gradient-to-r from-[#b8946a]/30 to-transparent" />
                  <span
                    className="font-inter text-sm font-medium tracking-wide"
                    style={{ color: '#9a7b52' }}
                  >
                    Est. Kathmandu
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Premium Stats Cards */}
          <div
            ref={cardsRef}
            className="lg:col-span-2 space-y-6 lg:pt-2"
          >
            {statsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl transition-all duration-500 hover:shadow-2xl hover:shadow-black/5"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(184, 148, 106, 0.08)',
                    padding: '28px',
                    ...getCardStyle(index)
                  }}
                >
                  {/* Premium hover gradient overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(184, 148, 106, 0.02) 0%, transparent 100%)'
                    }}
                  />

                  {/* Subtle top accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b8946a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />

                  <div className="relative flex items-start gap-5">
                    {/* Premium Icon Container */}
                    <div
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        background: 'linear-gradient(135deg, rgba(15, 30, 51, 0.04) 0%, rgba(184, 148, 106, 0.03) 100%)',
                        border: '1px solid rgba(184, 148, 106, 0.08)'
                      }}
                    >
                      <Icon
                        className="w-6 h-6 transition-colors duration-500"
                        style={{ color: '#9a7b52' }}
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <h3
                        className="font-playfair text-[22px] font-semibold mb-2.5 tracking-tight transition-colors duration-300 group-hover:text-[#0f1e33]"
                        style={{ color: '#1a2332' }}
                      >
                        {card.title}
                      </h3>
                      <p
                        className="font-inter text-[15px] leading-[1.7] tracking-tight"
                        style={{ color: '#556578' }}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Premium decorative element */}
            <div
              className="pt-6 opacity-40"
              style={getCardStyle(statsCards.length)}
            >
              <div className="w-16 h-px bg-gradient-to-r from-[#b8946a]/40 via-[#b8946a]/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}