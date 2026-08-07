import { useEffect, useState } from 'react';
import { LogIn, LogOut, Pencil } from 'lucide-react';
import Hero from '@/sections/Hero';
import About from '@/sections/About';
import OurWork from '@/sections/OurWork';
import SectoralFocus from '@/sections/SectoralFocus';
import ASGPP from '@/sections/ASGPP';
import ImpactMetrics from '@/sections/ImpactMetrics';
import Contact from '@/sections/Contact';
import Footer from '@/sections/Footer';
import Blog, { BlogReader, type Post } from '@/components/Blog';
import InlineEditor from '@/components/InlineEditor';
import SectionManager from '@/components/SectionManager';
import TypographyManager from '@/components/TypographyManager';
import { applySiteFont, type FontKey } from '@/lib/typography';
import { getSectionVisibility, getSiteContent, supabase, supabaseConfigured } from '@/lib/supabase';
import { R2_ASSET_URLS } from '@/lib/r2';
import CustomSections from '@/sections/CustomSections';

function Navigation({ signedIn, onLogin, onLogout, onEdit }: { signedIn: boolean; onLogin: () => void; onLogout: () => void; onEdit: () => void }) {
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
    { label: 'Blog', href: '#blog' },
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
                src={R2_ASSET_URLS.logo || '/src/assets/adi-logo.png'}
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
              {signedIn ? <><button onClick={onEdit} className="inline-flex items-center gap-1 font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#b8946a] hover:text-[#f8f6f1]"><Pencil className="h-3.5 w-3.5" />Edit site</button><button onClick={onLogout} className="text-[#f8f6f1]/60 hover:text-[#f8f6f1]" title="Sign out"><LogOut className="h-4 w-4" /></button></> : <button onClick={onLogin} className="inline-flex items-center gap-1 font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#f8f6f1]/75 hover:text-[#b8946a]"><LogIn className="h-3.5 w-3.5" />Sign in</button>}
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

function Login({ onClose, onSignedIn }: { onClose: () => void; onSignedIn: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return setError('Set the Supabase environment variables before signing in.');
    const data = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: String(data.get('email')), password: String(data.get('password')) });
      if (authError) throw authError;
      onSignedIn();
    }
    catch (authError) { setError(authError instanceof Error ? authError.message : 'That email or password was not accepted.'); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0a1525]/80 px-4 backdrop-blur-sm"><form onSubmit={submit} autoComplete="on" className="w-full max-w-sm rounded border border-[#b8946a]/40 bg-[#f8f6f1] p-7 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="section-label">ADI workspace</p><h2 className="mt-2 font-cormorant text-3xl text-[#0f1e33]">Sign in to edit</h2></div><button type="button" onClick={onClose} className="text-xl text-[#4a5568]">×</button></div><label className="mb-4 block font-inter text-sm text-[#4a5568]">Email<input required name="email" type="email" autoComplete="username" className="mt-1 w-full rounded border border-[#0f1e33]/20 bg-white px-3 py-2 outline-none focus:border-[#b8946a]" /></label><label className="block font-inter text-sm text-[#4a5568]">Password<input required name="password" type="password" autoComplete="current-password" className="mt-1 w-full rounded border border-[#0f1e33]/20 bg-white px-3 py-2 outline-none focus:border-[#b8946a]" /></label><p className="mt-3 font-inter text-xs leading-relaxed text-[#64748b]">You will remain signed in on this browser until you select Sign out.</p>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={busy || !supabaseConfigured} className="mt-6 w-full rounded bg-[#0f1e33] py-2.5 font-inter text-sm text-[#f8f6f1] disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button></form></div>;
}

function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [siteFont, setSiteFont] = useState<FontKey | undefined>();
  useEffect(() => {
    getSectionVisibility().then(records => setHiddenSections(records.filter(record => !record.visible).map(record => record.section_key))).catch(() => {});
  }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    getSiteContent().then(records => {
      const font = records.find(record => record.key === 'settings:site-font')?.value as FontKey | undefined;
      if (font) { applySiteFont(font); setSiteFont(font); }
    }).catch(() => {});
  }, []);
  const logout = () => { supabase?.auth.signOut(); setSignedIn(false); setEditing(false); };
  const readPost = (post: Post) => { setEditing(false); setOpenPost(post); window.scrollTo({ top: 0 }); };
  const closePost = () => {
    setOpenPost(null);
    requestAnimationFrame(() => document.querySelector('#blog')?.scrollIntoView());
  };
  const editPostFromReader = () => {
    setPostToEdit(openPost);
    setOpenPost(null);
    requestAnimationFrame(() => document.querySelector('#blog')?.scrollIntoView());
  };
  if (openPost) return <div className="relative"><Navigation signedIn={signedIn} onLogin={() => setShowLogin(true)} onLogout={logout} onEdit={() => setOpenPost(null)} /><BlogReader post={openPost} canWrite={signedIn} onBack={closePost} onEdit={editPostFromReader} /><Footer />{showLogin && <Login onClose={() => setShowLogin(false)} onSignedIn={() => { setSignedIn(true); setShowLogin(false); }} />}</div>;
  return (
    <div className="relative">
      <Navigation signedIn={signedIn} onLogin={() => setShowLogin(true)} onLogout={logout} onEdit={() => setEditing(true)} />
      <main>
        {!hiddenSections.includes('hero') && <Hero />}
        <Blog canWrite={signedIn} onOpenPost={readPost} postToEdit={postToEdit} onEdited={() => setPostToEdit(null)} />
        {!hiddenSections.includes('about') && <About />}
        {!hiddenSections.includes('ourWork') && <OurWork />}
        {!hiddenSections.includes('sectoralFocus') && <SectoralFocus />}
        {!hiddenSections.includes('asgpp') && <ASGPP />}
        {!hiddenSections.includes('impact') && <ImpactMetrics />}
        <CustomSections />
        {!hiddenSections.includes('contact') && <Contact />}
      </main>
      <Footer />
      <InlineEditor enabled={editing} onClose={() => setEditing(false)} />
      {editing && <SectionManager hidden={hiddenSections} onChange={setHiddenSections} />}
      {editing && <TypographyManager current={siteFont} onChange={setSiteFont} />}
      {showLogin && <Login onClose={() => setShowLogin(false)} onSignedIn={() => { setSignedIn(true); setShowLogin(false); setEditing(true); }} />}
    </div>
  );
}

export default App;
