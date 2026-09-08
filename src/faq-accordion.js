/* faq-accordion.js - MSP Launchpad blog FAQ accordion.
   Inside each .w-richtext: find the H2 whose text matches "frequently asked questions", then walk its following
   siblings up to the next H2. Every H3 starts an item: the H3 (element + id kept) becomes the parent of a
   button (mspl-faq__q, aria-expanded, aria-controls), the answer nodes up to the next H2/H3 move into a hidden
   panel div (mspl-faq__a, id), and the pair is wrapped in an item div (mspl-faq__item). Click toggles
   aria-expanded + hidden. Idempotent (data-mspl-faq="1" guard). Plain ES5, no IX2, no dependencies, so this SAME
   file pastes into a Webflow embed inside <script> tags. Runs on DOMContentLoaded AFTER tokens.js. (The file is
   inlined into the preview pages, so it never spells out a finished element - the static-html checks rely on it.) */
(function () {
  'use strict';
  var FAQ_RE = /frequently asked questions/i;

  function toggle(ev) {
    var btn = ev.currentTarget;
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) {
      if (open) panel.setAttribute('hidden', '');
      else panel.removeAttribute('hidden');
    }
  }

  function findFaqHeading(root) {
    var h2s = root.querySelectorAll('h2');
    for (var i = 0; i < h2s.length; i++) {
      if (h2s[i].getAttribute('data-mspl-role') === 'faq' || FAQ_RE.test(h2s[i].textContent || '')) return h2s[i];
    }
    return null;
  }

  function build(root) {
    if (root.getAttribute('data-mspl-faq') === '1') return;
    var faq = findFaqHeading(root);
    if (!faq) return;
    root.setAttribute('data-mspl-faq', '1');
    var node = faq.nextElementSibling, n = 0;
    while (node && node.tagName !== 'H2') {
      var next = node.nextElementSibling;
      if (node.tagName === 'H3') {
        // Empty questions are plain headings; never create a control with nothing useful to reveal.
        var probe = next, hasAnswer = false;
        while (probe && probe.tagName !== 'H2' && probe.tagName !== 'H3') {
          if ((probe.textContent || '').trim() || probe.querySelector('img,video,iframe')) hasAnswer = true;
          probe = probe.nextElementSibling;
        }
        if (!hasAnswer || !(node.textContent || '').trim()) { node = next; continue; }
        n++;
        var id = 'mspl-faq-' + n + (node.id ? '-' + node.id : '');
        var baseId = id, suffix = 1;
        while (document.getElementById(id)) id = baseId + '-' + suffix++;
        var item = document.createElement('div');
        item.className = 'mspl-faq__item';
        node.parentNode.insertBefore(item, node);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mspl-faq__q';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', id);
        while (node.firstChild) btn.appendChild(node.firstChild);
        node.appendChild(btn);
        item.appendChild(node);

        var panel = document.createElement('div');
        panel.className = 'mspl-faq__a';
        panel.id = id;
        panel.setAttribute('hidden', '');
        var ans = next;
        while (ans && ans.tagName !== 'H2' && ans.tagName !== 'H3') {
          var after = ans.nextElementSibling;
          panel.appendChild(ans);
          ans = after;
        }
        item.appendChild(panel);
        btn.addEventListener('click', toggle);
        next = ans;
      }
      node = next;
    }
  }

  function init() {
    var roots = document.querySelectorAll('.w-richtext');
    for (var i = 0; i < roots.length; i++) if (!roots[i].closest('.mspl-author')) build(roots[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
