async function login() {
  const statusEl = document.getElementById('loginStatus');
  const username = String(document.getElementById('loginUsername')?.value || '').trim();
  const password = String(document.getElementById('loginPassword')?.value || '');

  statusEl.textContent = '';

  try {
    const res = await fetch('/api/login', {
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
  const btn = document.getElementById('loginSubmit');
  const password = document.getElementById('loginPassword');

  btn.addEventListener('click', login);
  password.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
  });
});
