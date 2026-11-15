window.getUserApiKey = () => localStorage.getItem('user_gemini_api_key') || '';

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
  const btn = document.createElement('button');
  btn.innerHTML = window.getUserApiKey() ? '🔑 API چالاکە' : '🔑 دانانا API Key';
  btn.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:99999;background:#0f172a;color:#5eead4;border:2px solid #5eead4;padding:10px 18px;border-radius:99px;font-family:inherit;font-weight:bold;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.5);';

  btn.onclick = () => {
    const current = window.getUserApiKey();
    const input = prompt('کلیلێ Gemini API یێ خۆ یێ تایبەت ل ڤێرە بنڤیسە (ژ Google AI Studio بینە):', current);
    if (input !== null) {
      if (input.trim() === '') {
        localStorage.removeItem('user_gemini_api_key');
        btn.innerHTML = '🔑 دانانا API Key';
      } else {
        localStorage.setItem('user_gemini_api_key', input.trim());
        btn.innerHTML = '🔑 API چالاکە';
      }
      location.reload();
    }
  };
  document.body.appendChild(btn);
});
