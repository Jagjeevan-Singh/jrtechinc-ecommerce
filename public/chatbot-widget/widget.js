(function(){
  // FAQ dataset (finalized)
  const FAQ = [
    {
      category: 'Shipping & Returns',
      qas: [
        { q: 'What is your return policy?', a: 'We offer a 7-day return policy on all unused, original-condition items from the date of delivery. Please see our full policy page for details.' },
        { q: 'How long does shipping take?', a: 'Standard shipping within India takes 3-7 business days, depending on your location.' },
        { q: 'Can I track my order?', a: 'Yes! A tracking link is automatically emailed to you within 24 hours of placing your order.' },
        { q: 'Do you ship internationally?', a: 'Currently, we only ship within India.' },
        { q: 'What if my item arrives damaged?', a: 'Please contact us immediately with photos of the damage. We will process a replacement at no cost.' }
      ]
    },
    {
      category: 'Product & Account',
      qas: [
        { q: 'How do I change my password?', a: "Log in, go to 'My Account,' and select 'Security Settings' to change your password." },
        { q: 'How do I apply a coupon code?', a: 'Enter your coupon code in the designated field during checkout before finalizing your purchase.' },
        { q: 'Can I combine multiple orders?', a: 'Unfortunately, orders are processed immediately and cannot be combined once placed.' },
        { q: 'How do I subscribe to emails?', a: "Email subscription is a feature coming soon! Please check back later." },
        { q: 'Where can I find product specifications?', a: 'All detailed product specifications are listed under the "Description" tab on the specific product\'s landing page.' }
      ]
    }
  ];

  const ESCALATION_MSG = "I apologize, that specific query is not in my database. Please reach out to our human support team directly at jrtechinc21@gmail.com. They typically respond within 1 business day.";

  // Utility helpers
  function qs(selector, el=document){ return el.querySelector(selector); }

  // Initialize widget when DOM is ready (support both cases: listener added before or after DOMContentLoaded)
  function initWidget(){
    const root = qs('#jr-chatbot-root');
    if(!root) return;

    // grab elements (some are present in markup)
    const toggle = qs('#jr-chatbot-toggle');
    const panel = qs('#jr-chatbot-panel');
    const closeBtn = qs('#jr-chatbot-close');
    const searchInput = qs('#jr-chat-search');
    const searchBtn = qs('#jr-chat-search-btn');
    const suggestionsEl = qs('#jr-suggestions');
    const categoriesEl = qs('#jr-categories');
    const answerPane = qs('#jr-answer-pane');
    const answerQuestion = qs('#jr-answer-question');
    const answerText = qs('#jr-answer-text');
    const escalationEl = qs('#jr-escalation');

    // Image/fallback initialization: DO NOT modify visibility here — leave DOM/CSS to control display.
    // We keep lightweight listeners for debugging only but do not change styles or swap elements.
    (function ensureToggleImage(){
      if(!toggle) return;
      const img = toggle.querySelector('img');
      const fallbackSpan = toggle.querySelector('#jr-chat-fallback');

      // Hide fallback by default (CSS also handles this). Do not toggle it via JS.
      try { if(fallbackSpan) fallbackSpan.style.display = 'none'; } catch (_e) {}

      if(!img) {
        // No image present; nothing else to do here.
        return;
      }

      // For debugging only: log load/error events but do NOT alter visibility or styles.
      img.addEventListener('load', () => { });
      img.addEventListener('error', () => { });
    })();

    // Render categories and questions into categoriesEl
    function renderCategories(){
      categoriesEl.innerHTML = '';
      FAQ.forEach(cat => {
        const wrap = document.createElement('div');
        wrap.className = 'category';

        const h = document.createElement('h4');
        h.textContent = cat.category;
        wrap.appendChild(h);

        cat.qas.forEach(item => {
          const btn = document.createElement('button');
          btn.className = 'q-item';
          btn.type = 'button';
          btn.textContent = item.q;
          // show answer inline directly below this question
          btn.addEventListener('click', () => showAnswerInline(btn, item.q, item.a));
          wrap.appendChild(btn);
        });

        categoriesEl.appendChild(wrap);
      });
    }

    // Show answer in the bottom answer pane (legacy / search results)
    function showAnswer(question, answer, isEscalation=false){
      // hide any inline answers when showing the bottom pane
      removeInlineAnswers();
      answerQuestion.textContent = question;
      answerText.textContent = answer;
      escalationEl.hidden = true;
      if(isEscalation){
        escalationEl.textContent = ESCALATION_MSG;
        escalationEl.hidden = false;
      }
      answerPane.hidden = false;
      // ensure categories remain visible (we don't hide them) but scroll answer pane into view on small screens
      if(window.innerWidth <= 480){
        answerPane.scrollIntoView({behavior:'smooth', block:'center'});
      }
    }

    // Show an answer inline directly below the clicked element
    function showAnswerInline(anchorEl, question, answer, isEscalation=false){
      if(!anchorEl) return showAnswer(question, answer, isEscalation);
      // remove any previously inserted inline answers so only one is visible
      removeInlineAnswers();

  // create container (use LI when anchor is an LI so we keep valid list structure)
  const wrapperTag = (anchorEl.tagName && anchorEl.tagName.toLowerCase() === 'li') ? 'li' : 'div';
  const wrapper = document.createElement(wrapperTag);
  wrapper.className = 'inline-answer';
  if(wrapperTag === 'li') wrapper.style.listStyle = 'none';
      wrapper.setAttribute('role','region');
      wrapper.setAttribute('aria-live','polite');
      // question
      const qEl = document.createElement('div');
      qEl.className = 'answer-question';
      qEl.textContent = question;
      // answer
      const aEl = document.createElement('div');
      aEl.className = 'answer-text';
      aEl.textContent = answer;
      wrapper.appendChild(qEl);
      wrapper.appendChild(aEl);

      if(isEscalation){
        const esc = document.createElement('div');
        esc.className = 'escalation';
        esc.textContent = ESCALATION_MSG;
        wrapper.appendChild(esc);
      }

      // insert after the anchor element
      if(anchorEl.parentNode){
        anchorEl.parentNode.insertBefore(wrapper, anchorEl.nextSibling);
      }

      // hide the bottom answer pane when an inline answer is shown
      if(answerPane) answerPane.hidden = true;

      // scroll the inserted answer into view for small screens
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Remove any inline answers previously inserted
    function removeInlineAnswers(){
      const existing = panel.querySelectorAll('.inline-answer');
      existing.forEach(e => e.remove());
    }

    // Show escalation (unmatched) message alone
    function showEscalation(query){
      answerQuestion.textContent = query || 'Unrecognized query';
      answerText.textContent = '';
      escalationEl.textContent = ESCALATION_MSG;
      escalationEl.hidden = false;
      answerPane.hidden = false;
    }

    // Create flat list of questions for quick search
    const FLAT_QS = FAQ.reduce((acc, cat) => {
      cat.qas.forEach(item => acc.push({ category: cat.category, q: item.q, a: item.a }));
      return acc;
    }, []);

    // Search suggestions: case-insensitive partial match
    function getMatches(term){
      if(!term || !term.trim()) return [];
      const t = term.trim().toLowerCase();
      return FLAT_QS.filter(item => item.q.toLowerCase().includes(t));
    }

    // Render suggestion list
    function renderSuggestions(list){
      suggestionsEl.innerHTML = '';
      if(!list || list.length === 0){
        suggestionsEl.hidden = true;
        return;
      }
      suggestionsEl.hidden = false;
      list.slice(0,10).forEach(item => {
        const li = document.createElement('li');
        li.tabIndex = 0;
        li.textContent = item.q;
        li.className = 'suggestion-item';
        // show inline answer directly under the suggestion item
        li.addEventListener('click', () => showAnswerInline(li, item.q, item.a));
        li.addEventListener('keydown', (ev) => { if(ev.key === 'Enter') showAnswerInline(li, item.q, item.a); });
        suggestionsEl.appendChild(li);
      });
    }

    // Toggle panel open/close
    function openPanel(){
      panel.hidden = false;
      toggle.setAttribute('aria-expanded','true');
      renderCategories();
      answerPane.hidden = true; // show categories by default
      searchInput.value = '';
      renderSuggestions([]);
      searchInput.focus();
    }
    function closePanel(){
      panel.hidden = true;
      toggle.setAttribute('aria-expanded','false');
    }

    // Wire events
    // Toggle panel visibility using the hidden attribute so the element is present in the DOM
    // but shown/hidden instantly. Use toggleAttribute for concise behavior.
    toggle.addEventListener('click', () => {
      if (!panel) return;
      // flip the hidden attribute
      panel.toggleAttribute('hidden');

      // If panel is now hidden, run close logic; otherwise run open logic
      if (panel.hasAttribute('hidden')) {
        // ensure ARIA reflects state and run close housekeeping
        toggle.setAttribute('aria-expanded', 'false');
        closePanel();
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        openPanel();
      }
    });

    // Close button should hide the panel (set hidden = true)
    closeBtn.addEventListener('click', () => {
      if (!panel) return;
      panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
      closePanel();
    });

    // Search interactions
    searchInput.addEventListener('input', (e) => {
      const v = e.target.value;
      const matches = getMatches(v);
      renderSuggestions(matches);
    });

    // On Enter: if exact single match or single suggestion, show it; if no matches, show escalation message
    searchInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){
        const v = searchInput.value.trim();
        const matches = getMatches(v);
        if(matches.length === 1){
          showAnswer(matches[0].q, matches[0].a);
        } else if(matches.length > 1){
          // show top match
          showAnswer(matches[0].q, matches[0].a);
        } else {
          showEscalation(v);
        }
        suggestionsEl.innerHTML = '';
        suggestionsEl.hidden = true;
      }
    });

    // Search button click
    if(searchBtn) searchBtn.addEventListener('click', () => {
      const v = searchInput.value.trim();
      const matches = getMatches(v);
      if(matches.length >= 1){
        showAnswer(matches[0].q, matches[0].a);
      } else {
        showEscalation(v);
      }
      suggestionsEl.innerHTML = '';
      suggestionsEl.hidden = true;
    });

    // Click outside to close (but only when panel open)
    document.addEventListener('click', (ev) => {
      const target = ev.target;
      if(!panel || !toggle) return;
      if(panel.hidden || panel.hasAttribute('hidden')) return;
      if(panel.contains(target) || toggle.contains(target)) return;
      closePanel();
    });

    // Initialize UI state
    panel.hidden = true;
    suggestionsEl.hidden = true;
    renderCategories();

    // Expose a small API for diagnostics (optional)
    window.__JR_CHATBOT = { open: openPanel, close: closePanel, faq: FAQ };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
