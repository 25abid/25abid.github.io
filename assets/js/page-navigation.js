(() => {
  const main = document.querySelector('#main');
  const primaryLinks = [...document.querySelectorAll('.site-header nav a')];
  let current = new URL(location.href);
  let pending;
  const scrollPositions = new Map();

  const pageKey = url => url.pathname + url.search;
  const isPage = url => url.origin === location.origin && url.pathname.endsWith('/');
  history.scrollRestoration = 'manual';

  function reveal(url, restoreScroll) {
    main.focus({ preventScroll: true });
    if (restoreScroll && scrollPositions.has(url.href)) {
      window.scrollTo(0, scrollPositions.get(url.href));
    } else {
      const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    }
  }

  async function navigate(url, fromHistory = false) {
    pending?.abort();
    scrollPositions.set(current.href, window.scrollY);
    const request = new AbortController();
    pending = request;

    try {
      const response = await fetch(url, { signal: request.signal });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        throw new Error('Expected a site page');
      }
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (request.signal.aborted) return;
      const nextMain = page.querySelector('#main');
      if (!nextMain || !page.querySelector('.text-wall')) throw new Error('Expected the shared layout');

      if (!fromHistory) history.pushState(null, '', url);
      current = url;
      document.title = page.title;
      document.querySelector('meta[name="description"]').content =
        page.querySelector('meta[name="description"]').content;
      main.replaceChildren(...nextMain.childNodes);

      const active = page.querySelector('.site-header nav [aria-current="page"]')?.getAttribute('href');
      for (const link of primaryLinks) {
        if (link.getAttribute('href') === active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
      for (const source of main.querySelectorAll('script[src]')) {
        const script = document.createElement('script');
        script.src = source.getAttribute('src');
        source.replaceWith(script);
      }
      reveal(url, fromHistory);
    } catch {
      if (!request.signal.aborted) {
        if (fromHistory || location.href === url.href) location.reload();
        else location.assign(url);
      }
    } finally {
      if (pending === request) pending = null;
    }
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (!isPage(url) || pageKey(url) === pageKey(current)) return;
    event.preventDefault();
    navigate(url);
  });

  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    if (pageKey(url) !== pageKey(current)) {
      navigate(url, true);
    } else {
      pending?.abort();
      if (scrollPositions.has(url.href)) reveal(url, true);
      current = url;
    }
  });

  window.addEventListener('hashchange', () => {
    const url = new URL(location.href);
    if (pageKey(url) === pageKey(current)) current = url;
  });
})();
