window.getUserApiKey = () => localStorage.getItem('user_gemini_api_key') || '';

// پاراستنا کلیلی ب هەمی ناڤێن سڵایدشۆیان
function syncKeyToStorage(key) {
  if (key) {
    localStorage.setItem('user_gemini_api_key', key);
    localStorage.setItem('gk', key);
    localStorage.setItem('gk2', key);
  } else {
    localStorage.removeItem('user_gemini_api_key');
    localStorage.removeItem('gk');
    localStorage.removeItem('gk2');
  }
}

const originalFetch = window.fetch;
window.fetch = async function(resource, config = {}) {
  const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
  const userKey = window.getUserApiKey();

  if (url.includes('/api/gemini/') && userKey) {
    config = { ...config, headers: { ...(config.headers || {}), 'x-custom-key': userKey } };
  }

  if (url.includes('generativelanguage.googleapis.com') && userKey) {
    const newUrl = new URL(url);
    newUrl.searchParams.set('key', userKey);
    return originalFetch(newUrl.toString(), config);
  }

  return originalFetch(resource, config);
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.getUserApiKey()) syncKeyToStorage(window.getUserApiKey());
});

setInterval(() => {
  const userKey = window.getUserApiKey();
  if (!userKey) return;

  document.querySelectorAll('iframe').forEach((iframe) => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'SET_API_KEY', apiKey: userKey }, '*');
      }
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (doc) {
        ['ak', 'cbk'].forEach((id) => {
          const el = doc.getElementById(id);
          if (el && !el.value) {
            el.value = userKey;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        doc.querySelectorAll('input').forEach((inp) => {
          if (inp.placeholder && inp.placeholder.includes('AIza') && !inp.value) {
            inp.value = userKey;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    } catch (e) {}
  });
}, 600);
