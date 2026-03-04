import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const quickLinks = [
  { label: 'About ADI', href: '#about' },
  { label: 'Our Work', href: '#our-work' },
  { label: 'Digital Governance', href: '#sectoral-focus' },
  { label: 'Public Health', href: '#sectoral-focus' },
  { label: 'ASGPP', href: '#asgpp' },
];

const connectLinks = [
  { label: 'Contact Us', href: '#contact' },
  { label: 'Partnership Opportunities', href: '#contact' },
  { label: 'Careers', href: '#contact' },
];

export default function Footer() {
  const { ref: footerRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      ref={footerRef}
      className="relative py-20 lg:py-24 overflow-hidden"
      style={{ backgroundColor: '#070d16' }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div
          className={`grid md:grid-cols-3 gap-14 lg:gap-20 mb-16 lg:mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {/* Column 1 - Brand */}
          <div className="md:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/src/assets/adi-logo.png"
                alt="ADI Logo"
                className="h-36 w-auto object-contain"
              />
              <span
                className="font-inter text-sm tracking-wider"
                style={{ color: '#f8f6f1' }}
              >
                Asia Dialogue Initiative
              </span>
            </div>

            {/* Motto */}
            <p
              className="font-inter text-xs tracking-[2.5px] uppercase mb-5"
              style={{ color: '#9a7b52' }}
            >
              Dialogue. Peace. Development. Education.
            </p>

            {/* Tagline */}
            <p
              className="font-inter text-base leading-relaxed"
              style={{ color: 'rgba(248, 246, 241, 0.6)' }}
            >
              Building lasting peace through trusted dialogue
            </p>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h4
              className="font-inter text-sm tracking-[2.5px] uppercase mb-8"
              style={{ color: '#9a7b52' }}
            >
              Explore
            </h4>
            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="font-inter text-base transition-colors duration-300"
                    style={{ color: 'rgba(248, 246, 241, 0.6)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#b8946a'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(248, 246, 241, 0.6)'}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Connect */}
          <div>
            <h4
              className="font-inter text-sm tracking-[2.5px] uppercase mb-8"
              style={{ color: '#9a7b52' }}
            >
              Connect
            </h4>
            <ul className="space-y-4">
              {connectLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="font-inter text-base transition-colors duration-300"
                    style={{ color: 'rgba(248, 246, 241, 0.6)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#b8946a'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(248, 246, 241, 0.6)'}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`pt-10 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          style={{ borderTop: '1px solid rgba(248, 246, 241, 0.08)' }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p
              className="font-inter text-sm text-center sm:text-left"
              style={{ color: 'rgba(248, 246, 241, 0.4)' }}
            >
              &copy; 2023 Asia Dialogue Initiative. All rights reserved.
            </p>
            <p
              className="font-inter text-sm text-center sm:text-right"
              style={{ color: 'rgba(248, 246, 241, 0.4)' }}
            >
              Based in Kathmandu, Nepal | Working across Asia
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
