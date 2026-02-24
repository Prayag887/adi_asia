import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { MapPin, Mail, Globe, Send, ChevronRight } from 'lucide-react';

// ─── Decorative connection orb ────────────────────────────────────────────────
function ConnectionOrb() {
  const points = [
    { cx: 200, cy: 200, label: 'Kathmandu', primary: true },
    // { cx: 310, cy: 130, label: 'Myanmar' },
    { cx: 270, cy: 290, label: 'Afghanistan' },
    { cx: 100, cy: 160, label: 'Myanmar' },
    { cx: 340, cy: 230, label: 'Nepal' },
  ];

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto select-none">
      {/* Outer rings */}
      {[1, 0.72, 0.48].map((scale, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border border-[#b8946a]/10"
          style={{
            transform: `scale(${scale})`,
            top: '50%', left: '50%',
            width: '100%', height: '100%',
            marginTop: '-50%', marginLeft: '-50%',
            animation: `spin-slow ${40 + i * 15}s linear infinite ${i % 2 === 1 ? 'reverse' : ''}`,
          }}
        />
      ))}

      {/* SVG lines + dots */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b8946a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0f1e33" stopOpacity="0" />
          </radialGradient>
          <filter id="dot-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Ambient glow */}
        <circle cx="200" cy="200" r="140" fill="url(#orbGrad)" />

        {/* Connection lines */}
        {points.slice(1).map((p, i) => (
          <line
            key={i}
            x1="200" y1="200" x2={p.cx} y2={p.cy}
            stroke="#b8946a"
            strokeWidth="0.75"
            strokeOpacity="0.25"
            strokeDasharray="5 5"
          />
        ))}

        {/* Secondary dots */}
        {points.slice(1).map((p, i) => (
          <circle
            key={i}
            cx={p.cx} cy={p.cy} r="5"
            fill="#1a2942"
            stroke="#b8946a"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        ))}

        {/* Primary dot — Kathmandu */}
        <circle cx="200" cy="200" r="10" fill="#b8946a" filter="url(#dot-glow)" />
        <circle
          cx="200" cy="200" r="20"
          fill="none" stroke="#b8946a" strokeWidth="1" strokeOpacity="0.4"
          style={{ animation: 'ping 2.5s ease-out infinite' }}
        />
      </svg>

      {/* Labels */}
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute text-center"
          style={{
            left: `${(p.cx / 400) * 100}%`,
            top: `${(p.cy / 400) * 100}%`,
            transform: 'translate(-50%, -140%)',
          }}
        >
          <span
            className={`font-cinzel text-[9px] tracking-widest uppercase whitespace-nowrap ${p.primary ? 'text-[#b8946a]' : 'text-[#f8f6f1]/40'
              }`}
          >
            {p.label}
          </span>
        </div>
      ))}

      <style>{`
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Contact info item ─────────────────────────────────────────────────────────
function InfoItem({
  icon: Icon,
  label,
  value,
  href,
  delay,
  visible,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
  delay: number;
  visible: boolean;
}) {
  const content = (
    <div className="flex items-start gap-4 group">
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
        style={{ background: 'rgba(184, 148, 106, 0.12)', border: '1px solid rgba(184, 148, 106, 0.2)' }}
      >
        <Icon className="w-5 h-5" style={{ color: '#b8946a' }} />
      </div>
      <div>
        <p className="font-cinzel text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: '#b8946a' }}>
          {label}
        </p>
        <p className="font-inter text-[15px] text-[#f8f6f1] leading-snug group-hover:text-[#b8946a] transition-colors duration-300">
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {href ? <a href={href}>{content}</a> : content}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Contact() {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation({ threshold: 0.15 });

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate send — wire up to real backend as needed
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1400);
  };

  const inputBase =
    'w-full bg-white/5 border border-[#f8f6f1]/10 rounded-xl px-4 py-3 font-inter text-[15px] text-[#f8f6f1] placeholder-[#f8f6f1]/30 outline-none transition-all duration-300 focus:border-[#b8946a]/60 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(184,148,106,0.08)]';

  return (
    <section
      id="contact"
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a1525 0%, #0f1e33 50%, #0a1525 100%)' }}
    >
      {/* Background grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.018,
        }}
      />

      {/* Gold glow top-right */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(184,148,106,0.06) 0%, transparent 70%)' }}
      />
      {/* Teal glow bottom-left */}
      <div
        className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(30,64,64,0.18) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Section header */}
        <div
          ref={leftRef}
          className="text-center mb-20"
          style={{
            opacity: leftVisible ? 1 : 0,
            transform: leftVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          }}
        >
          <span className="font-cinzel text-[10px] tracking-[0.3em] uppercase" style={{ color: '#b8946a' }}>
            Reach Out
          </span>
          <h2
            className="font-cormorant text-5xl sm:text-6xl lg:text-7xl font-light text-[#f8f6f1] mt-4 mb-5 leading-tight"
          >
            Get In Touch
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(184,148,106,0.4))' }} />
            <p className="font-inter text-base text-[#f8f6f1]/55 max-w-lg">
              We welcome inquiries about our work, partnership opportunities, and academic programs.
            </p>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(184,148,106,0.4))' }} />
          </div>
        </div>

        {/* Two-column content */}
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">

          {/* ── Left: Info + Orb ─────────────────────────────────────────── */}
          <div
            ref={leftRef}
            className="space-y-12"
            style={{
              opacity: leftVisible ? 1 : 0,
              transform: leftVisible ? 'translateX(0)' : 'translateX(-32px)',
              transition: 'opacity 0.9s ease-out 0.1s, transform 0.9s ease-out 0.1s',
            }}
          >
            {/* Connection orb visual */}
            <div className="flex justify-center lg:justify-start">
              <ConnectionOrb />
            </div>

            {/* Contact info */}
            <div className="space-y-7 pl-2">
              <InfoItem
                icon={MapPin}
                label="Office"
                value={"Suryabinayak 4, Bhaktapur\nNepal"}
                delay={200}
                visible={leftVisible}
              />
              <InfoItem
                icon={Mail}
                label="Email"
                value="asiacan@asiacan.org"
                href="mailto:asiacan@asiacan.org"
                delay={350}
                visible={leftVisible}
              />
              <InfoItem
                icon={Globe}
                label="Coverage"
                value="Nepal · Myanmar · Afghanistan"
                delay={500}
                visible={leftVisible}
              />
            </div>

            {/* Divider line */}
            <div
              className="h-px w-full transition-all duration-1000"
              style={{
                background: 'linear-gradient(to right, rgba(184,148,106,0.3), transparent)',
                opacity: leftVisible ? 1 : 0,
                transitionDelay: '600ms',
              }}
            />

            {/* Tagline */}
            <p
              className="font-cormorant text-2xl font-light italic text-[#f8f6f1]/40 leading-relaxed transition-all duration-700"
              style={{ opacity: leftVisible ? 1 : 0, transitionDelay: '700ms' }}
            >
              "Dialogue, when sustained with patience,<br />becomes the architecture of peace."
            </p>
          </div>

          {/* ── Right: Contact form ───────────────────────────────────────── */}
          <div
            ref={rightRef}
            style={{
              opacity: rightVisible ? 1 : 0,
              transform: rightVisible ? 'translateX(0)' : 'translateX(32px)',
              transition: 'opacity 0.9s ease-out 0.2s, transform 0.9s ease-out 0.2s',
            }}
          >
            <div
              className="rounded-2xl p-8 sm:p-10"
              style={{
                background: 'rgba(248,246,241,0.035)',
                border: '1px solid rgba(248,246,241,0.08)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
              }}
            >
              {sent ? (
                /* ── Success state ── */
                <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(184,148,106,0.15)', border: '1px solid rgba(184,148,106,0.35)' }}
                  >
                    <Send className="w-7 h-7" style={{ color: '#b8946a' }} />
                  </div>
                  <h3 className="font-cormorant text-3xl text-[#f8f6f1] font-light">Message Sent</h3>
                  <p className="font-inter text-[15px] text-[#f8f6f1]/55 max-w-xs">
                    Thank you for reaching out. We'll be in touch with you shortly.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-[#b8946a] hover:text-[#c9a87a] transition-colors duration-300 mt-2"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="mb-8">
                    <h3 className="font-cormorant text-3xl sm:text-4xl text-[#f8f6f1] font-light mb-1">
                      Send a Message
                    </h3>
                    <p className="font-inter text-[13px] text-[#f8f6f1]/40">
                      We read every message personally.
                    </p>
                  </div>

                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-cinzel text-[9px] tracking-[0.2em] uppercase text-[#b8946a]">Name</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                        className={inputBase}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-cinzel text-[9px] tracking-[0.2em] uppercase text-[#b8946a]">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        className={inputBase}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="font-cinzel text-[9px] tracking-[0.2em] uppercase text-[#b8946a]">Subject</label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className={inputBase + ' cursor-pointer'}
                      style={{ appearance: 'none' }}
                    >
                      <option value="" disabled style={{ background: '#0f1e33' }}>Select a topic…</option>
                      <option value="partnership" style={{ background: '#0f1e33' }}>Partnership Inquiry</option>
                      <option value="asgpp" style={{ background: '#0f1e33' }}>ASGPP / Academic Programs</option>
                      <option value="mediation" style={{ background: '#0f1e33' }}>Mediation & Dialogue Work</option>
                      <option value="media" style={{ background: '#0f1e33' }}>Media & Press</option>
                      <option value="other" style={{ background: '#0f1e33' }}>Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="font-cinzel text-[9px] tracking-[0.2em] uppercase text-[#b8946a]">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us about your inquiry…"
                      required
                      className={inputBase + ' resize-none'}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-inter font-medium text-[15px] transition-all duration-300 disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: sending
                        ? 'rgba(184,148,106,0.5)'
                        : 'linear-gradient(135deg, #b8946a 0%, #a08055 100%)',
                      color: 'white',
                      boxShadow: '0 4px 20px rgba(184,148,106,0.3)',
                    }}
                  >
                    {sending ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <p className="font-inter text-[12px] text-center text-[#f8f6f1]/25 pt-1">
                    Or email us directly at{' '}
                    <a href="mailto:asiacan@asiacan.org" className="text-[#b8946a]/60 hover:text-[#b8946a] transition-colors">
                      asiacan@asiacan.org
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
