import { useEffect, useState } from 'react';
import { getCustomSections } from '@/lib/supabase';

type CustomSection = { id: string; title: string; body: string; position: number };

export default function CustomSections() {
  const [sections, setSections] = useState<CustomSection[]>([]);

  useEffect(() => {
    const load = () => getCustomSections().then(setSections).catch(() => setSections([]));
    load();
    window.addEventListener('custom-sections-updated', load);
    return () => window.removeEventListener('custom-sections-updated', load);
  }, []);

  return <>{sections.map((section, index) => <section key={section.id} className={`relative overflow-hidden py-24 lg:py-32 ${index % 2 ? 'bg-[#0f1e33] text-[#f8f6f1]' : 'bg-[#faf9f6] text-[#0f1e33]'}`}>
    <div className="mx-auto max-w-4xl px-6 text-center sm:px-8"><div className="mx-auto mb-6 h-px w-12 bg-[#b8946a]" /><h2 className="font-cormorant text-4xl font-semibold sm:text-5xl">{section.title}</h2><p className={`mx-auto mt-7 max-w-3xl whitespace-pre-wrap font-inter leading-relaxed ${index % 2 ? 'text-[#f8f6f1]/75' : 'text-[#4a5568]'}`}>{section.body}</p></div>
  </section>)}</>;
}
