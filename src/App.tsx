import { useEffect, useState } from 'react';
import Hero from '@/sections/Hero';
import About from '@/sections/About';
import OurWork from '@/sections/OurWork';
import SectoralFocus from '@/sections/SectoralFocus';
import ASGPP from '@/sections/ASGPP';
import ImpactMetrics from '@/sections/ImpactMetrics';
import Contact from '@/sections/Contact';
import Footer from '@/sections/Footer';


function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger solid background immediately upon scrolling
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Our Work', href: '#our-work' },
    { label: 'Focus Areas', href: '#sectoral-focus' },
    { label: 'ASGPP', href: '#asgpp' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled
          ? 'bg-[#0f1e33]/95 backdrop-blur-md shadow-lg py-1'
          : 'bg-transparent py-2'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 group"
            >
              <img
                src="/src/assets/adi-logo.png"
                alt="ADI Logo"
                className={`w-auto object-contain transition-all duration-700 origin-left ${isScrolled ? 'h-10 sm:h-14 lg:h-16 scale-95' : 'h-12 sm:h-20 lg:h-24 scale-100'
                  }`}
              />
              <span className={`font-garamond text-[#f8f6f1] text-sm sm:text-base tracking-wide transition-all duration-500 ${isScrolled ? 'opacity-90' : 'opacity-100'
                }`}>
                Asia Dialogue Initiative
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="font-cinzel text-[11px] text-[#f8f6f1]/75 hover:text-[#b8946a] transition-colors duration-300 tracking-[0.15em] uppercase"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-[#f8f6f1]"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-5">
                <span
                  className={`absolute left-0 w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'top-2 rotate-45' : 'top-0'
                    }`}
                />
                <span
                  className={`absolute left-0 top-2 w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                />
                <span
                  className={`absolute left-0 w-full h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'top-2 -rotate-45' : 'top-4'
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div
          className="absolute inset-0 bg-[#0f1e33]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="relative h-full flex flex-col items-center justify-center gap-8">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              className={`font-cormorant text-4xl font-light text-[#f8f6f1] hover:text-[#b8946a] transition-all duration-500 tracking-wide ${isMobileMenuOpen
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
                }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <div className="relative">
      <Navigation />
      <main>
        <Hero />
        <About />
        <OurWork />
        <SectoralFocus />
        <ASGPP />
        <ImpactMetrics />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
