// Nav scroll shadow
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 100);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
reveals.forEach(el => observer.observe(el));

// Contact form — submits to Formspree, emails forwarded to ceo@magtech.se
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Sending…';
  btn.style.pointerEvents = 'none';
  const form = e.target;
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      document.getElementById('success-msg').style.display = 'block';
      btn.style.display = 'none';
      form.reset();
    } else {
      document.getElementById('error-msg').style.display = 'block';
      btn.textContent = 'Send message';
      btn.style.pointerEvents = 'auto';
    }
  } catch {
    document.getElementById('error-msg').style.display = 'block';
    btn.textContent = 'Send message';
    btn.style.pointerEvents = 'auto';
  }
});
