// Site nav behaviour: mobile drawer, keep the current episode pill in view,
// and mirror the framed page's #hash and title into the address bar.
(function () {
  var btn = document.querySelector('.menubtn');
  var drawer = document.querySelector('.drawer');
  if (btn && drawer) {
    btn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && window.innerWidth > 860) {
        var r = btn.getBoundingClientRect();
        drawer.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 408)) + 'px';
      } else { drawer.style.left = ''; }
    });
    document.addEventListener('click', function (e) {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !btn.contains(e.target)) {
        drawer.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { drawer.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  var cur = document.querySelector('.eps [aria-current="page"]');
  if (cur && cur.scrollIntoView) {
    var eps = cur.parentElement;
    eps.scrollLeft = cur.offsetLeft - eps.clientWidth / 2 + cur.clientWidth / 2;
  }

  var frame = document.querySelector('.framewrap iframe');
  if (!frame) return;

  // Pass a deep link (e.g. /sand-to-thought#ch3) through to the framed page.
  if (location.hash) frame.src = frame.getAttribute('data-src') + location.hash;

  function sync() {
    try {
      var w = frame.contentWindow;
      if (drawer) drawer.classList.remove('open');
      var h = w.location.hash || '';
      if (h !== location.hash) history.replaceState(null, '', location.pathname + h);
      w.addEventListener('hashchange', function () {
        history.replaceState(null, '', location.pathname + (w.location.hash || ''));
      });
      // Any link inside an episode that points at another site page should open at the top level.
      w.document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var u = new URL(a.href, w.location.href);
        if (u.origin === location.origin && !u.pathname.startsWith('/pages/')) { e.preventDefault(); location.href = u.href; }
      });
    } catch (err) { /* cross-origin: ignore */ }
  }
  frame.addEventListener('load', sync);
})();
