import { sendContactMessage } from '@/lib/api';

const form = document.querySelector<HTMLFormElement>('[data-contact]');
const status = document.querySelector<HTMLElement>('[data-contact-status]');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const button = form.querySelector('button')!;
  button.disabled = true;
  try {
    await sendContactMessage({
      name: String(data.get('name')),
      email: String(data.get('email')),
      subject: String(data.get('subject') || ''),
      message: String(data.get('message')),
    });
    form.reset();
    if (status) status.textContent = 'Thanks — your message was sent.';
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : 'Could not send the message.';
  } finally {
    button.disabled = false;
  }
});
