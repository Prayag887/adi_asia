import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, LayoutPanelTop, Plus, Trash2, X } from 'lucide-react';
import { createCustomSection, deleteCustomSection, getCustomSections, setSectionVisibility } from '@/lib/supabase';

const sections = [
  ['hero', 'Hero'], ['about', 'About'], ['ourWork', 'Our Work'], ['sectoralFocus', 'Focus Areas'], ['asgpp', 'ASGPP'], ['impact', 'Impact'], ['contact', 'Contact'],
] as const;
type CustomSection = { id: string; title: string; body: string; position: number };

export default function SectionManager({ hidden, onChange }: { hidden: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState<CustomSection[]>([]);
  const load = () => getCustomSections().then(setCustom).catch(() => setCustom([]));
  useEffect(() => { if (open) load(); }, [open]);
  const toggle = async (key: string) => {
    const next = hidden.includes(key) ? hidden.filter(item => item !== key) : [...hidden, key];
    const visible = !next.includes(key);
    await setSectionVisibility(key, visible);
    onChange(next);
  };
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createCustomSection({ title: String(data.get('title')), body: String(data.get('body')), position: custom.length + 1 });
    event.currentTarget.reset(); load(); window.dispatchEvent(new Event('custom-sections-updated'));
  };
  if (!open) return <button onClick={() => setOpen(true)} data-editor-ignore className="fixed bottom-20 right-5 z-[61] inline-flex items-center gap-2 rounded-full bg-[#f8f6f1] px-4 py-3 font-inter text-sm text-[#0f1e33] shadow-xl ring-1 ring-[#b8946a]/40 hover:bg-white"><LayoutPanelTop className="h-4 w-4 text-[#9a7b52]" />Manage sections</button>;
  return <div data-editor-ignore className="fixed inset-0 z-[70] bg-[#0a1525]/65 p-4 backdrop-blur-sm"><div className="ml-auto h-full w-full max-w-lg overflow-y-auto rounded-xl bg-[#faf9f6] p-6 shadow-2xl"><div className="mb-7 flex items-start justify-between"><div><p className="section-label">Page structure</p><h2 className="mt-2 font-cormorant text-3xl text-[#0f1e33]">Manage sections</h2><p className="mt-2 font-inter text-sm text-[#4a5568]">Hide or restore existing sections, or add new ones.</p></div><button onClick={() => setOpen(false)} className="rounded p-2 text-[#4a5568] hover:bg-[#e8e4dc]"><X /></button></div><div className="space-y-2">{sections.map(([key, label]) => { const isHidden = hidden.includes(key); return <button key={key} onClick={() => toggle(key)} className="flex w-full items-center justify-between rounded-lg border border-[#0f1e33]/10 bg-white px-4 py-3 text-left font-inter text-sm text-[#0f1e33] hover:border-[#b8946a]/60"><span>{label}</span>{isHidden ? <span className="inline-flex items-center gap-1 text-[#9a7b52]"><EyeOff className="h-4 w-4" />Hidden</span> : <span className="inline-flex items-center gap-1 text-[#55735b]"><Eye className="h-4 w-4" />Visible</span>}</button>; })}</div><div className="my-8 border-t border-[#0f1e33]/10" /><h3 className="font-cormorant text-2xl text-[#0f1e33]">Add a new section</h3><form onSubmit={create} className="mt-4 space-y-3"><input required name="title" placeholder="Section title" className="w-full rounded border border-[#0f1e33]/20 bg-white px-3 py-2 font-inter text-sm outline-none focus:border-[#b8946a]" /><textarea required name="body" placeholder="Write the section content…" className="min-h-28 w-full rounded border border-[#0f1e33]/20 bg-white px-3 py-2 font-inter text-sm outline-none focus:border-[#b8946a]" /><button className="inline-flex items-center gap-2 rounded bg-[#0f1e33] px-4 py-2 font-inter text-sm text-[#f8f6f1]"><Plus className="h-4 w-4" />Add section</button></form>{custom.length > 0 && <div className="mt-7 space-y-2">{custom.map(section => <div key={section.id} className="flex items-center justify-between rounded border border-[#0f1e33]/10 bg-white px-3 py-2"><span className="font-inter text-sm text-[#0f1e33]">{section.title}</span><button onClick={async () => { await deleteCustomSection(section.id); load(); window.dispatchEvent(new Event('custom-sections-updated')); }} className="rounded p-1.5 text-red-700 hover:bg-red-50" title="Delete section"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</div></div>;
}
