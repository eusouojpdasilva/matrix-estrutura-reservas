(() => {
  const config = window.SCANDIA_CONFIG;
  if (!config?.trackingEnabled) return;

  if (config.ga4MeasurementId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `/scripts/gtag.js?id=${encodeURIComponent(config.ga4MeasurementId)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.ga4MeasurementId);
  }

  if (config.metaPixelId) {
    const fbq = window.fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    fbq('init', config.metaPixelId);
    const eventId = crypto.randomUUID();
    fbq('track', 'PageView', {}, { eventID: eventId });
    fetch('/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_name: 'PageView', event_id: eventId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: location.href, user_data: {},
      }),
    }).catch(() => {});
  }
})();
