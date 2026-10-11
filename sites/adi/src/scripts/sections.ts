import { createCustomSection, deleteCustomSection, getCustomSections, getSectionVisibility, setSectionVisibility, type CustomSection } from '@/lib/api';
import { fromTemplate, getState, setState, show, subscribe } from './state';

const openButton = document.querySelector<HTMLElement>('[data-sections-open]')!;
const panel = document.querySelector<HTMLElement>('[data-sections-panel]')!;
const list = panel.querySelector<HTMLElement>('[data-custom-list]')!;
const customHost = document.querySelector<HTMLElement>('[data-custom-sections]')!;
let panelOpen = false;
let custom: CustomSection[] = [];

subscribe((state) => {
  document.querySelectorAll<HTMLElement>('main[data-home] [data-section]').forEach((section) => {
    show(section, !state.hiddenSections.includes(section.dataset.section!));
  });
  panel.querySelectorAll<HTMLElement>('[data-section-toggle]').forEach((button) => {
    const hidden = state.hiddenSections.includes(button.dataset.sectionToggle!);
    show(button.querySelector('[data-state="hidden"]'), hidden);
    show(button.querySelector('[data-state="visible"]'), !hidden);
  });
  if (!state.editing) panelOpen = false;
  show(openButton, state.editing && !panelOpen);
  show(panel, state.editing && panelOpen);
});

function renderCustom() {
  customHost.replaceChildren(...custom.map((section, index) => {
    const el = fromTemplate('custom-section');
    el.classList.add(...(index % 2 ? ['bg-[#0f1e33]', 'text-[#f8f6f1]'] : ['bg-[#faf9f6]', 'text-[#0f1e33]']));
    el.querySelector('[data-title]')!.textContent = section.title;
    const body = el.querySelector<HTMLElement>('[data-body]')!;
    body.textContent = section.body;
    body.classList.add(index % 2 ? 'text-[#f8f6f1]/75' : 'text-[#4a5568]');
    return el;
  }));
  list.replaceChildren(...custom.map((section) => {
    const row = fromTemplate('custom-row');
    row.querySelector('[data-title]')!.textContent = section.title;
    row.querySelector('[data-delete]')!.addEventListener('click', async () => {
      await deleteCustomSection(section.id);
      await loadCustom();
    });
    return row;
  }));
  show(list, custom.length > 0);
}

async function loadCustom() {
  custom = await getCustomSections().catch(() => []);
  renderCustom();
}

openButton.addEventListener('click', () => { panelOpen = true; setState({}); loadCustom(); });
panel.querySelector('[data-sections-close]')!.addEventListener('click', () => { panelOpen = false; setState({}); });

panel.querySelectorAll<HTMLElement>('[data-section-toggle]').forEach((button) => button.addEventListener('click', async () => {
  const key = button.dataset.sectionToggle!;
  const { hiddenSections } = getState();
  const next = hiddenSections.includes(key) ? hiddenSections.filter((item) => item !== key) : [...hiddenSections, key];
  await setSectionVisibility(key, !next.includes(key));
  setState({ hiddenSections: next });
}));

const form = panel.querySelector<HTMLFormElement>('[data-custom-form]')!;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  await createCustomSection({ title: String(data.get('title')), body: String(data.get('body')), position: custom.length + 1 });
  form.reset();
  await loadCustom();
});

getSectionVisibility()
  .then((records) => setState({ hiddenSections: records.filter((r) => !r.visible).map((r) => r.section_key) }))
  .catch(() => {});
loadCustom();
