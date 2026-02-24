import { useScrollAnimation, useCountUp } from '@/hooks/useScrollAnimation';

interface MetricCardProps {
  value: string;
  label: string;
  isNumeric?: boolean;
  delay?: number;
}

function MetricCard({ value, label, isNumeric = true, delay = 0 }: MetricCardProps) {
  const numericValue = isNumeric ? parseInt(value) : 0;
  const { count, ref } = useCountUp(numericValue, 2000);
  const { ref: cardRef, isVisible } = useScrollAnimation({ threshold: 0.5 });

  return (
    <div
      ref={(el) => {
        if (el) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      }}
      className={`text-center p-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold mb-5"
        style={{ color: '#9a7b52' }}
      >
        {isNumeric ? count : value}
      </div>
      <div
        className="font-inter text-base tracking-[1.5px] uppercase"
        style={{ color: '#4a5568' }}
      >
        {label}
      </div>
    </div>
  );
}

export default function ImpactMetrics() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.3 });

  const metrics = [
    { value: '3', label: 'Countries of Operation', isNumeric: true },
    { value: '2', label: 'Sectoral Focus Areas', isNumeric: true },
    { value: '3', label: 'Academic Programs', isNumeric: true },
    { value: '1', label: 'Regional Platform', isNumeric: true },
  ];

  return (
    <section
      id="impact-metrics"
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ backgroundColor: '#f8f6f1' }}
    >
      {/* Subtle Texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#0f1e33" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Title */}
        <div ref={titleRef} className="text-center mb-16 lg:mb-20">
          <h2
            className={`section-title transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            Creating Lasting <span style={{ color: '#9a7b52' }}>Impact</span>
          </h2>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              value={metric.value}
              label={metric.label}
              isNumeric={metric.isNumeric}
              delay={index * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}