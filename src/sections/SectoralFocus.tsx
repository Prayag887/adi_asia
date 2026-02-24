// import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';
// import { Check, Shield } from 'lucide-react';
//
// const digitalGovernanceParagraphs = [
//   {
//     text: 'Digital governance is central to building accountable institutions and strengthening public trust. In contexts marked by bureaucratic complexity and uneven service delivery, digital systems can reduce discretion, improve transparency, and enhance citizens\' access to the state.',
//   },
//   {
//     text: 'A core pillar of digital governance is Digital Public Infrastructure (DPI)—shared digital systems that enable the delivery of essential public services at scale. Properly implemented, DPI can lower transaction costs, curb informal practices, and improve the everyday experience of state–citizen interaction.',
//   },
//   {
//     text: 'Within this framework, Asia Dialogue Initiative (ADI) provides policy and programmatic support to agencies of the Government of Nepal. ADI works alongside public institutions to strengthen digital governance strategies, support implementation processes, and ensure that digital reforms remain responsive to local realities.',
//   },
//   {
//     text: 'By linking governance reform with institutional capacity and public trust, ADI views digital governance as an enabling condition for sustainable peace.',
//   },
// ];
//
// const digitalOutcomes = [
//   'Enhanced transparency',
//   'Reduced bureaucratic friction',
//   'Improved citizen access',
//   'Strengthened institutional legitimacy',
// ];
//
// const publicHealthParagraphs = [
//   {
//     text: 'Equitable access to health services strengthens trust between communities and public institutions, reduces everyday vulnerabilities, and mitigates grievances that often deepen social divisions. Effective public health systems function not only as service providers but also as instruments of health governance.',
//   },
//   {
//     text: 'In Nepal, strengthening public health governance supports broader objectives of inclusion, federal coordination, and accountable service delivery. Improvements in access, quality, and responsiveness generate tangible peace dividends by demonstrating the state\'s capacity to meet basic needs fairly and consistently.',
//   },
//   {
//     text: 'In Afghanistan, where prolonged conflict has eroded health infrastructure, community-based health initiatives play a critical role in sustaining social cohesion and human dignity, often serving as one of the few remaining interfaces between institutions and the population.',
//   },
//   {
//     text: 'Asia Dialogue Initiative (ADI) supports public health initiatives as part of a peace-sustaining approach. In Nepal, ADI engages with public institutions and stakeholders to strengthen health governance, coordination, and policy implementation. In Afghanistan, ADI\'s locally embedded teams work with communities and partners to facilitate access to essential health services, recognizing that credible health systems generate peace dividends.',
//   },
// ];
//
// const peaceDividends = [
//   'Reduced uncertainty',
//   'Reinforced community trust',
//   'Strengthened social cohesion',
//   'Long-term stability',
// ];
//
// export default function SectoralFocus() {
//   const { ref: dgHeaderRef, isVisible: dgHeaderVisible } = useScrollAnimation({ threshold: 0.2 });
//   const { ref: phHeaderRef, isVisible: phHeaderVisible } = useScrollAnimation({ threshold: 0.2 });
//   const { containerRef: dgParagraphsRef, getItemStyle: getDgParagraphStyle } = useStaggerAnimation(digitalGovernanceParagraphs.length, 0.15);
//   const { containerRef: phParagraphsRef, getItemStyle: getPhParagraphStyle } = useStaggerAnimation(publicHealthParagraphs.length, 0.15);
//
//   return (
//     <section
//       id="sectoral-focus"
//       className="relative py-28 lg:py-36 overflow-hidden"
//       style={{ backgroundColor: '#f8f6f1' }}
//     >
//       {/* Subtle Texture */}
//       <div
//         className="absolute inset-0 opacity-[0.02] pointer-events-none"
//         style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
//         }}
//       />
//
//       {/* Decorative Elements */}
//       <div className="absolute inset-0 pointer-events-none">
//         <div
//           className="absolute w-[400px] h-[400px] rounded-full opacity-[0.02]"
//           style={{
//             top: '20%',
//             right: '-10%',
//             background: 'radial-gradient(circle, #0f1e33 0%, transparent 70%)'
//           }}
//         />
//         <div
//           className="absolute w-[300px] h-[300px] rounded-full opacity-[0.02]"
//           style={{
//             bottom: '10%',
//             left: '-5%',
//             background: 'radial-gradient(circle, #0f1e33 0%, transparent 70%)'
//           }}
//         />
//       </div>
//
//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
//         {/* 4A. Digital Governance */}
//         <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center mb-28 lg:mb-36">
//           {/* Content Column */}
//           <div ref={dgHeaderRef}>
//             <span
//               className={`section-label transition-all duration-700 ${
//                 dgHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
//               }`}
//             >
//               Sectoral Focus
//             </span>
//             <h2
//               className={`section-title mt-5 mb-10 transition-all duration-700 delay-200 ${
//                 dgHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'
//               }`}
//             >
//               Digital Governance
//             </h2>
//
//             <div ref={dgParagraphsRef} className="space-y-5 max-w-xl">
//               {digitalGovernanceParagraphs.map((paragraph, index) => (
//                 <p
//                   key={index}
//                   className="body-text"
//                   style={getDgParagraphStyle(index)}
//                 >
//                   {paragraph.text}
//                 </p>
//               ))}
//             </div>
//
//             {/* Key Outcomes Card */}
//             <div
//               className={`mt-10 p-8 rounded-lg transition-all duration-700 delay-700 ${
//                 dgHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
//               }`}
//               style={{
//                 backgroundColor: 'white',
//                 borderLeft: '3px solid #b8946a',
//                 boxShadow: '0 4px 24px rgba(15, 30, 51, 0.06)'
//               }}
//             >
//               <h4
//                 className="font-playfair text-lg font-semibold mb-5"
//                 style={{ color: '#0f1e33' }}
//               >
//                 Key Outcomes
//               </h4>
//               <ul className="space-y-3">
//                 {digitalOutcomes.map((outcome, index) => (
//                   <li key={index} className="flex items-center gap-3">
//                     <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#9a7b52' }} />
//                     <span className="font-inter text-base" style={{ color: '#4a5568' }}>{outcome}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//
//           {/* Visual Column - Static elegant design */}
//           <div
//             className={`relative transition-all duration-1000 delay-500 ${
//               dgHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
//             }`}
//           >
//             <div className="relative w-full aspect-square max-w-md mx-auto">
//               {/* Central element */}
//               <div
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full flex items-center justify-center"
//                 style={{
//                   background: 'linear-gradient(135deg, rgba(184, 148, 106, 0.15) 0%, rgba(184, 148, 106, 0.05) 100%)',
//                   border: '1px solid rgba(184, 148, 106, 0.25)'
//                 }}
//               >
//                 <div
//                   className="w-10 h-10 rounded-full"
//                   style={{ backgroundColor: 'rgba(184, 148, 106, 0.4)' }}
//                 />
//               </div>
//
//               {/* Orbiting dots - static */}
//               {[0, 72, 144, 216, 288].map((angle, i) => {
//                 const rad = (angle * Math.PI) / 180;
//                 const x = 50 + 35 * Math.cos(rad);
//                 const y = 50 + 35 * Math.sin(rad);
//                 return (
//                   <div
//                     key={i}
//                     className="absolute w-3 h-3 rounded-full"
//                     style={{
//                       left: `${x}%`,
//                       top: `${y}%`,
//                       transform: 'translate(-50%, -50%)',
//                       backgroundColor: i === 0 ? '#b8946a' : 'rgba(15, 30, 51, 0.2)'
//                     }}
//                   />
//                 );
//               })}
//
//               {/* Outer ring */}
//               <div
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full"
//                 style={{ border: '1px solid rgba(15, 30, 51, 0.08)' }}
//               />
//               <div
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full"
//                 style={{ border: '1px solid rgba(15, 30, 51, 0.05)' }}
//               />
//             </div>
//           </div>
//         </div>
//
//         {/* 4B. Public Health */}
//         <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
//           {/* Visual Column (Left on desktop) - Static elegant design */}
//           <div
//             className={`relative order-2 lg:order-1 transition-all duration-1000 delay-300 ${
//               phHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'
//             }`}
//           >
//             <div className="relative w-full aspect-square max-w-md mx-auto">
//               {/* Central element */}
//               <div
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full flex items-center justify-center"
//                 style={{
//                   background: 'linear-gradient(135deg, rgba(107, 122, 94, 0.15) 0%, rgba(107, 122, 94, 0.05) 100%)',
//                   border: '1px solid rgba(107, 122, 94, 0.25)'
//                 }}
//               >
//                 <div
//                   className="w-10 h-10 rounded-full"
//                   style={{ backgroundColor: 'rgba(107, 122, 94, 0.4)' }}
//                 />
//               </div>
//
//               {/* Concentric rings - static */}
//               <div
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full"
//                 style={{ border: '1px solid rgba(107, 122, 94, 0.15)' }}
//               />
//               <div
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full"
//                 style={{ border: '1px solid rgba(107, 122, 94, 0.1)' }}
//               />
//               <div
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full"
//                 style={{ border: '1px solid rgba(107, 122, 94, 0.06)' }}
//               />
//
//               {/* Decorative dots */}
//               {[0, 120, 240].map((angle, i) => {
//                 const rad = (angle * Math.PI) / 180;
//                 const x = 50 + 42 * Math.cos(rad);
//                 const y = 50 + 42 * Math.sin(rad);
//                 return (
//                   <div
//                     key={i}
//                     className="absolute w-2 h-2 rounded-full"
//                     style={{
//                       left: `${x}%`,
//                       top: `${y}%`,
//                       transform: 'translate(-50%, -50%)',
//                       backgroundColor: 'rgba(107, 122, 94, 0.3)'
//                     }}
//                   />
//                 );
//               })}
//             </div>
//           </div>
//
//           {/* Content Column (Right on desktop) */}
//           <div ref={phHeaderRef} className="order-1 lg:order-2">
//             <span
//               className={`section-label transition-all duration-700 ${
//                 phHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
//               }`}
//             >
//               Sectoral Focus
//             </span>
//             <h2
//               className={`section-title mt-5 mb-10 transition-all duration-700 delay-200 ${
//                 phHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
//               }`}
//             >
//               Public Health
//             </h2>
//
//             <div ref={phParagraphsRef} className="space-y-5 max-w-xl">
//               {publicHealthParagraphs.map((paragraph, index) => (
//                 <p
//                   key={index}
//                   className="body-text"
//                   style={getPhParagraphStyle(index)}
//                 >
//                   {paragraph.text}
//                 </p>
//               ))}
//             </div>
//
//             {/* Peace Dividends Card */}
//             <div
//               className={`mt-10 p-8 rounded-lg transition-all duration-700 delay-700 ${
//                 phHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'
//               }`}
//               style={{
//                 backgroundColor: 'white',
//                 borderLeft: '3px solid #6b7a5e',
//                 boxShadow: '0 4px 24px rgba(15, 30, 51, 0.06)'
//               }}
//             >
//               <h4
//                 className="font-playfair text-lg font-semibold mb-5"
//                 style={{ color: '#0f1e33' }}
//               >
//                 Peace Dividends
//               </h4>
//               <ul className="space-y-3">
//                 {peaceDividends.map((dividend, index) => (
//                   <li key={index} className="flex items-center gap-3">
//                     <Shield className="w-5 h-5 flex-shrink-0" style={{ color: '#6b7a5e' }} />
//                     <span className="font-inter text-base" style={{ color: '#4a5568' }}>{dividend}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }



import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Check, Shield, ArrowRight, Layers, Activity } from 'lucide-react';

const sectors = {
  digitalGovernance: {
    id: 'digital',
    title: 'Digital Governance',
    icon: Layers,
    color: '#b8946a',
    lightColor: 'rgba(184, 148, 106, 0.1)',
    description: 'Building accountable institutions through digital transformation',
    paragraphs: [
      'Digital governance plays a key role in building accountable institutions and public trust. In complex bureaucratic settings, digital systems can reduce discretion, increase transparency, and improve citizens’ access to the state.',
      'A core element of digital governance is Digital Public Infrastructure (DPI)—shared systems that enable large-scale delivery of public services. When implemented well, DPI lowers transaction costs, limits informal practices, and improves everyday state–citizen interactions.',
      'Within this framework, the Asia Dialogue Initiative (ADI) supports agencies of the Government of Nepal by strengthening digital governance strategies, assisting implementation, and ensuring reforms remain grounded in local realities.',
      'By linking institutional capacity with public trust, ADI views digital governance as an enabling condition for sustainable peace.',
    ],
    outcomes: [
      'Enhanced transparency',
      'Reduced bureaucratic friction',
      'Improved citizen access',
      'Strengthened institutional legitimacy',
    ],
  },
  publicHealth: {
    id: 'health',
    title: 'Public Health',
    icon: Activity,
    color: '#6b7a5e',
    lightColor: 'rgba(107, 122, 94, 0.1)',
    description: 'Strengthening health systems as instruments of peace',
    paragraphs: [
      'Equitable access to health services strengthens trust between communities and public institutions, reduces everyday vulnerabilities, and mitigates grievances that often deepen social divisions. Effective public health systems function not only as service providers but also as instruments of health governance.',
      'In Nepal, strengthening public health governance supports broader objectives of inclusion, federal coordination, and accountable service delivery. Improvements in access, quality, and responsiveness generate tangible peace dividends by demonstrating the state\'s capacity to meet basic needs fairly and consistently.',
      'In Afghanistan, where prolonged conflict has eroded health infrastructure, community-based health initiatives play a critical role in sustaining social cohesion and human dignity, often serving as one of the few remaining interfaces between institutions and the population.',
      'Asia Dialogue Initiative (ADI) supports public health initiatives as part of a peace-sustaining approach. In Nepal, ADI engages with public institutions and stakeholders to strengthen health governance, coordination, and policy implementation. In Afghanistan, ADI\'s locally embedded teams work with communities and partners to facilitate access to essential health services, recognizing that credible health systems generate peace dividends.',
    ],
    outcomes: [
      'Reduced uncertainty',
      'Reinforced community trust',
      'Strengthened social cohesion',
      'Long-term stability',
    ],
  },
};

export default function SectoralFocus() {
  const [activeSector, setActiveSector] = useState('digital');
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const currentSector = sectors[activeSector === 'digital' ? 'digitalGovernance' : 'publicHealth'];
  const Icon = currentSector.icon;

  return (
    <section
      id="sectoral-focus"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ backgroundColor: '#f8f6f1' }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #0f1e33 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4"
            style={{
              backgroundColor: 'rgba(184, 148, 106, 0.1)',
              color: '#b8946a',
            }}
          >
            Our Focus Areas
          </span>
          <h2
            className="font-playfair text-4xl lg:text-5xl font-bold mb-5"
            style={{ color: '#0f1e33' }}
          >
            Sectoral Focus
          </h2>
          <p className="font-inter text-lg" style={{ color: '#6b7280' }}>
            Strategic interventions in digital governance and public health
          </p>
        </div>

        {/* Sector Toggle */}
        <div
          className={`flex justify-center mb-12 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <div
            className="inline-flex p-1.5 rounded-xl"
            style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(15, 30, 51, 0.08)' }}
          >
            {Object.entries(sectors).map(([key, sector]) => {
              const SectorIcon = sector.icon;
              const isActive = (key === 'digitalGovernance' && activeSector === 'digital') ||
                (key === 'publicHealth' && activeSector === 'health');

              return (
                <button
                  key={sector.id}
                  onClick={() => setActiveSector(sector.id)}
                  className="relative px-8 py-4 rounded-lg font-inter font-semibold transition-all duration-300 flex items-center gap-3"
                  style={{
                    backgroundColor: isActive ? sector.lightColor : 'transparent',
                    color: isActive ? sector.color : '#6b7280',
                  }}
                >
                  <SectorIcon className="w-5 h-5" />
                  <span>{sector.title}</span>
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full"
                      style={{ backgroundColor: sector.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column - Main Content */}
            <div
              className="space-y-8"
              style={{
                animation: isVisible ? 'fadeInLeft 0.6s ease-out' : 'none',
              }}
            >
              {/* Hero Card */}
              <div
                className="p-8 rounded-2xl"
                style={{
                  backgroundColor: 'white',
                  boxShadow: '0 8px 32px rgba(15, 30, 51, 0.08)',
                  borderTop: `4px solid ${currentSector.color}`,
                }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: currentSector.lightColor }}
                  >
                    <Icon className="w-8 h-8" style={{ color: currentSector.color }} />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-playfair text-2xl font-bold mb-2"
                      style={{ color: '#0f1e33' }}
                    >
                      {currentSector.title}
                    </h3>
                    <p className="font-inter text-[15px] leading-relaxed" style={{ color: '#6b7280' }}>
                      {currentSector.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentSector.paragraphs.map((text, index) => (
                    <p
                      key={index}
                      className="font-inter text-[15px] leading-[1.85]"
                      style={{
                        color: '#4a5568',
                        animation: isVisible ? `fadeIn 0.6s ease-out ${0.3 + index * 0.1}s both` : 'none',
                      }}
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Outcomes */}
            <div
              className="space-y-6"
              style={{
                animation: isVisible ? 'fadeInRight 0.6s ease-out 0.3s both' : 'none',
              }}
            >
              {/* Sticky Outcomes Card */}
              <div className="lg:sticky lg:top-24">
                <div
                  className="p-8 rounded-2xl"
                  style={{
                    backgroundColor: 'white',
                    boxShadow: '0 8px 32px rgba(15, 30, 51, 0.08)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentSector.color }}
                    />
                    <h4
                      className="font-playfair text-xl font-bold"
                      style={{ color: '#0f1e33' }}
                    >
                      {activeSector === 'digital' ? 'Key Outcomes' : 'Peace Dividends'}
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {currentSector.outcomes.map((outcome, index) => (
                      <div
                        key={index}
                        className="group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:translate-x-2"
                        style={{
                          backgroundColor: currentSector.lightColor,
                          animation: isVisible ? `fadeIn 0.4s ease-out ${0.5 + index * 0.1}s both` : 'none',
                        }}
                      >
                        <div
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: 'white' }}
                        >
                          {activeSector === 'digital' ? (
                            <Check className="w-4 h-4" style={{ color: currentSector.color }} />
                          ) : (
                            <Shield className="w-4 h-4" style={{ color: currentSector.color }} />
                          )}
                        </div>
                        <span
                          className="font-inter text-[15px] font-medium"
                          style={{ color: '#0f1e33' }}
                        >
                          {outcome}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-8 pt-6 border-t" style={{ borderColor: currentSector.lightColor }}>
                    <button
                      className="group w-full flex items-center justify-between p-4 rounded-xl font-inter font-semibold transition-all duration-300 hover:translate-x-1"
                      style={{
                        backgroundColor: currentSector.lightColor,
                        color: currentSector.color,
                      }}
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Quote Card */}
                <div
                  className="mt-6 p-6 rounded-xl"
                  style={{
                    backgroundColor: currentSector.lightColor,
                    borderLeft: `4px solid ${currentSector.color}`,
                  }}
                >
                  <p
                    className="font-playfair italic text-lg leading-relaxed"
                    style={{ color: '#0f1e33' }}
                  >
                    {activeSector === 'digital'
                      ? '"Digital infrastructure as an enabling condition for sustainable peace"'
                      : '"Health governance as a foundation for social cohesion"'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats/Impact Section */}
        <div
          className={`mt-20 grid md:grid-cols-3 gap-6 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {[
            { label: 'Countries', value: '3' },
            { label: 'Focus Areas', value: '2' },
            { label: 'Approach', value: 'Peace-Sustaining' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-8 rounded-xl"
              style={{
                backgroundColor: 'white',
                boxShadow: '0 4px 16px rgba(15, 30, 51, 0.06)',
              }}
            >
              <div
                className="font-playfair text-4xl font-bold mb-2"
                style={{ color: currentSector.color }}
              >
                {stat.value}
              </div>
              <div className="font-inter text-sm uppercase tracking-wider" style={{ color: '#6b7280' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}