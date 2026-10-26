import { Suspense } from 'react';
import { unlock } from '../actions';
import { Flash, param } from '../ui';

// Admin password gate - the first screen, like the original's
// "Please enter password" prompt.
export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <>
      <h1>Admin login</h1>
      <p className="muted">Enter the demo password to continue.</p>
      <Suspense fallback={null}>
        <Flash searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <UnlockForm searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function UnlockForm({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const next = param((await searchParams).next) ?? '';
  return (
    <form action={unlock} className="card">
      <input type="hidden" name="next" value={next} />
      <label>
        Password
        <input name="password" type="password" required autoFocus autoComplete="current-password" />
      </label>
      <button type="submit">Enter</button>
    </form>
  );
}
