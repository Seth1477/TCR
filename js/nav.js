// Mobile nav toggle
const burger = document.querySelector('.header__burger');
const mobileNav = document.querySelector('.mobile-nav');
if (burger && mobileNav) {
  burger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
}

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const isOpen = btn.classList.contains('active');
    // close all
    document.querySelectorAll('.faq-question').forEach(b => {
      b.classList.remove('active');
      if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
    });
    // open this one if it was closed
    if (!isOpen) {
      btn.classList.add('active');
      if (answer) answer.classList.add('open');
    }
  });
});

// Before/After slider
const sliderWrap = document.querySelector('.slider-wrap');
if (sliderWrap) {
  const afterPane = sliderWrap.querySelector('.slider-after');
  const handle = sliderWrap.querySelector('.slider-handle');

  function setPosition(x) {
    const rect = sliderWrap.getBoundingClientRect();
    let pct = (x - rect.left) / rect.width;
    pct = Math.min(Math.max(pct, 0.02), 0.98);
    afterPane.style.width = pct * 100 + '%';
    handle.style.left = pct * 100 + '%';
  }

  let dragging = false;
  sliderWrap.addEventListener('mousedown', e => { dragging = true; setPosition(e.clientX); });
  window.addEventListener('mousemove', e => { if (dragging) setPosition(e.clientX); });
  window.addEventListener('mouseup', () => { dragging = false; });

  sliderWrap.addEventListener('touchstart', e => { dragging = true; setPosition(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchmove', e => { if (dragging) setPosition(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; });
}
