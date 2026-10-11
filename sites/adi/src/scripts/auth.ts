import { getCurrentUser, signIn, signOut } from '@/lib/api';
import { getState, setState, show, subscribe } from './state';

const modal = document.querySelector<HTMLElement>('[data-login]')!;
const form = document.querySelector<HTMLFormElement>('[data-login-form]')!;
const error = form.querySelector<HTMLElement>('[data-login-error]')!;
const submit = form.querySelector<HTMLButtonElement>('[data-login-submit]')!;

subscribe((state) => {
  document.querySelectorAll<HTMLElement>('[data-auth="in"]').forEach((el) => show(el, state.signedIn));
  document.querySelectorAll<HTMLElement>('[data-auth="out"]').forEach((el) => show(el, !state.signedIn));
});

const close = () => show(modal, false);
document.querySelector('[data-action="login"]')!.addEventListener('click', () => {
  show(error, false);
  show(modal, true);
});
form.querySelector('[data-login-close]')!.addEventListener('click', close);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  submit.disabled = true;
  submit.textContent = 'Signing in…';
  show(error, false);
  try {
    await signIn(String(data.get('email')), String(data.get('password')));
    close();
    // From the home page, signing in drops straight into edit mode (the reader view does not).
    setState({ signedIn: true, editing: !getState().openPost });
  } catch (err) {
    error.textContent = err instanceof Error ? err.message : 'That email or password was not accepted.';
    show(error, true);
  } finally {
    submit.disabled = false;
    submit.textContent = 'Sign in';
  }
});

document.querySelector('[data-action="logout"]')!.addEventListener('click', () => {
  signOut().catch(() => {});
  setState({ signedIn: false, editing: false });
});

document.querySelector('[data-action="edit"]')!.addEventListener('click', () => {
  // In the reader, "Edit site" just returns to the page (matching the previous behaviour).
  if (getState().openPost) setState({ openPost: null });
  else setState({ editing: true });
});

getCurrentUser().then((user) => setState({ signedIn: Boolean(user) }));
