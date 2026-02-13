async function redirectIfLoggedIn() {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  try {
    const res = await fetch('/api/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      localStorage.removeItem('authToken');
      return;
    }

    window.location.href = '/app.html';
  } catch {
    // ignore network errors
  }
}

document.addEventListener('DOMContentLoaded', redirectIfLoggedIn);
