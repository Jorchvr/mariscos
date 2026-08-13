(function () {
  'use strict';

  const USERS = [
    { user: 'admin',  pass: '1234', name: 'Administrador', role: 'admin' },
    { user: 'cajero', pass: '1234', name: 'Cajero',        role: 'cajero' },
  ];

  // Auto-redirect if already logged in
  try {
    const sess = JSON.parse(localStorage.getItem('lp_session') || 'null');
    if (sess && sess.user) window.location.replace('pos.html');
  } catch (_) {}

  const form = document.getElementById('loginForm');
  const errBox = document.getElementById('loginError');
  const togglePw = document.getElementById('togglePw');
  const pwField = document.getElementById('password');

  togglePw.addEventListener('click', () => {
    const isPw = pwField.type === 'password';
    pwField.type = isPw ? 'text' : 'password';
    togglePw.textContent = isPw ? '🙈' : '👁';
  });

  // Prefill last user if remember checked
  try {
    const remembered = localStorage.getItem('lp_last_user');
    if (remembered) document.getElementById('username').value = remembered;
  } catch (_) {}

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');

    const u = document.getElementById('username').value.trim().toLowerCase();
    const p = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    const match = USERS.find(x => x.user === u && x.pass === p);
    if (!match) {
      errBox.classList.remove('hidden');
      pwField.focus(); pwField.select();
      return;
    }

    const session = {
      user: match.user,
      name: match.name,
      role: match.role,
      loggedAt: new Date().toISOString(),
    };
    localStorage.setItem('lp_session', JSON.stringify(session));
    if (remember) localStorage.setItem('lp_last_user', match.user);
    else localStorage.removeItem('lp_last_user');

    // Nice little transition
    document.querySelector('.login-card').style.transition = 'transform .2s, opacity .2s';
    document.querySelector('.login-card').style.transform = 'scale(.98)';
    document.querySelector('.login-card').style.opacity = '0.6';
    setTimeout(() => window.location.replace('pos.html'), 180);
  });
})();
