import { getSiteContent } from '@/lib/api';
import type { FontKey } from '@/lib/typography';
import './auth';
import './blog';
import './reader';
import './sections';
import { prepareEditor } from './editor';
import { setInitialFont } from './typography';

getSiteContent()
  .then((records) => {
    const values = new Map(records.map((r) => [r.key, r.value]));
    setInitialFont(values.get('settings:site-font') as FontKey | undefined);
    prepareEditor(values);
  })
  // Keep the page editable even if the content API is briefly unavailable.
  .catch(() => prepareEditor(new Map()));
