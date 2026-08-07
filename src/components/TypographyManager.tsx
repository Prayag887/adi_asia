import { useState } from 'react';
import { Check, LoaderCircle, Type, X } from 'lucide-react';
import { saveSiteContent } from '@/lib/supabase';
import { applySiteFont, fontChoices, type FontKey } from '@/lib/typography';

export default function TypographyManager({ current, onChange }: { current?: FontKey; onChange: (font: FontKey) => void }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<FontKey>(current || 'cormorant');
  const [saving, setSaving] = useState(false);
  const select = (font: FontKey) => { setChoice(font); applySiteFont(font); };
  const save = async () => {
    setSaving(true);
    try { await saveSiteContent({ 'settings:site-font': choice }); onChange(choice); setOpen(false); }
    finally { setSaving(false); }
  };
  if (!open) return <button onClick={() => setOpen(true)} data-editor-ignore className="fixed bottom-36 right-5 z-[61] inline-flex items-center gap-2 rounded-full bg-[#f8f6f1] px-4 py-3 font-inter text-sm text-[#0f1e33] shadow-xl ring-1 ring-[#b8946a]/40 hover:bg-white"><Type className="h-4 w-4 text-[#9a7b52]" />Typography</button>;
  return <div data-editor-ignore className="fixed inset-0 z-[72] grid place-items-center bg-[#0a1525]/65 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-xl bg-[#faf9f6] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="section-label">Site-wide style</p><h2 className="mt-2 font-cormorant text-3xl text-[#0f1e33]">Choose a font</h2><p className="mt-2 font-inter text-sm text-[#4a5568]">This applies to the entire experience, including navigation, buttons, headings, body copy, and the blog.</p></div><button onClick={() => setOpen(false)} className="rounded p-2 text-[#4a5568] hover:bg-[#e8e4dc]"><X /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{(Object.entries(fontChoices) as [FontKey, typeof fontChoices[FontKey]][]).map(([key, font]) => <button key={key} onClick={() => select(key)} className={`rounded-lg border p-4 text-left transition ${choice === key ? 'border-[#b8946a] bg-[#b8946a]/10 ring-1 ring-[#b8946a]' : 'border-[#0f1e33]/10 bg-white hover:border-[#b8946a]/50'}`}><span className="block text-xl text-[#0f1e33]" style={{ fontFamily: font.value }}>{font.label}</span><span className="mt-1 block font-inter text-xs text-[#4a5568]">The quick brown fox</span></button>)}</div><div className="mt-7 flex justify-end gap-3"><button onClick={() => setOpen(false)} className="px-4 py-2 font-inter text-sm text-[#4a5568]">Cancel</button><button onClick={save} disabled={saving} className="rounded bg-[#0f1e33] px-5 py-2 font-inter text-sm text-[#f8f6f1]">{saving ? <LoaderCircle className="mr-1 inline h-4 w-4 animate-spin" /> : <Check className="mr-1 inline h-4 w-4" />}Save typography</button></div></div></div>;
}
