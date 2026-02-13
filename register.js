async function register() {
  const statusEl = document.getElementById('regStatus');
  const username = String(document.getElementById('regUsername')?.value || '').trim();
  const password = String(document.getElementById('regPassword')?.value || '');

  statusEl.textContent = '';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = data?.error || 'request_failed';
      throw new Error(err);
    }

    localStorage.setItem('authToken', data.token);
    window.location.href = '/app.html';
  } catch (e) {
    statusEl.textContent = `Ошибка: ${e.message}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('regSubmit');
  const password = document.getElementById('regPassword');

  btn.addEventListener('click', register);
  password.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') register();
  });
});
