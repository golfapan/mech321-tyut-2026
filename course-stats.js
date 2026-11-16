(() => {
  'use strict';

  const { course, endpoint } = document.currentScript.dataset;
  const prefix = `/${course}/`;
  if (location.origin !== 'https://golfapan.github.io' ||
      !location.pathname.startsWith(prefix) ||
      !/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint)) return;

  window.goatcounter = {
    path: location.pathname.replace(/\/index\.html$/, '/'),
    referrer: '',
  };

  const script = document.createElement('script');
  script.src = 'https://gc.zgo.at/count.js';
  script.async = true;
  script.dataset.goatcounter = endpoint;
  script.referrerPolicy = 'no-referrer';
  document.head.appendChild(script);

  function recordResourceClick(event) {
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const link = event.target.closest?.('a[href]');
    const statistics = window.goatcounter;
    if (!link || !statistics.count) return;

    const resource = new URL(link.href);
    if (resource.origin !== location.origin || !resource.pathname.startsWith(prefix) ||
        !/\.(pdf|zip|mp4|webm)$/i.test(resource.pathname)) return;

    statistics.count({
      path: `file${resource.pathname}`,
      title: decodeURI(resource.pathname.slice(prefix.length)),
      event: true,
      no_session: true,
    });
  }

  document.addEventListener('click', recordResourceClick);
  document.addEventListener('auxclick', recordResourceClick);
})();
