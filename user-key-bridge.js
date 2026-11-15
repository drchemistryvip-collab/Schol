// ٤. پڕکرنا خۆکار یا خانەیا API Key دناڤ هەمی iframe یێن سڵایدشۆیان دا
setInterval(() => {
  const userKey = window.getUserApiKey();
  if (!userKey) return;

  document.querySelectorAll('iframe').forEach((iframe) => {
    try {
      // ١. فرێکرنا کلیلێ ڕاستەقینە ب رێکا postMessage
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'SET_API_KEY', apiKey: userKey }, '*');
      }

      // ٢. پشکنینا ناڤەڕۆکا سڵایدشۆیێ و پڕکرنا خۆکار یا خانەیا (AIza...)
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (doc) {
        doc.localStorage.setItem('gemini_api_key', userKey);
        doc.localStorage.setItem('user_gemini_api_key', userKey);

        const inputs = doc.querySelectorAll('input');
        inputs.forEach((inp) => {
          if (inp.placeholder && inp.placeholder.includes('AIza') && !inp.value) {
            inp.value = userKey;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    } catch (e) {
      // ئەگەر iframe ل سەر دۆمەینەکێ جودا بیت، ب تنێ postMessage کار دکەت
    }
  });
}, 800);
