// ==UserScript==
// @name         YouTube: Not interested button on hover preview
// @namespace    gonza.userscripts
// @version      1.1.0
// @description  Adds a "Not interested" button next to the mute / CC buttons on YouTube's hover video preview. Clicking it does exactly what the 3-dot menu's "Not interested" does.
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // Icon of the "Not interested" menu item; used for our button and to find the item in any UI language.
  const ICON = 'M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 018.246 12.605L4.755 6.661A8.99 8.99 0 0112 3ZM3.754 8.393l15.491 8.944A9 9 0 013.754 8.393Z';

  // Hide the 3-dot menu while we drive it, so it doesn't flash.
  document.head.append(Object.assign(document.createElement('style'), {
    textContent: 'html.tm-ni-busy tp-yt-iron-dropdown { opacity: 0 !important; }',
  }));

  async function notInterested(preview) {
    const id = new URL(preview.querySelector('a[href*="watch?v="]').href).searchParams.get('v');
    const card = document.querySelector(`ytd-rich-item-renderer:has(a[href*="v=${id}"])`);
    if (!card) return;

    document.documentElement.classList.add('tm-ni-busy');
    card.querySelector('.ytLockupMetadataViewModelMenuButton button').click();
    for (let i = 0; i < 40; i++) {
      const item = [...document.querySelectorAll(`tp-yt-iron-dropdown yt-list-item-view-model:has(path[d="${ICON}"]) button`)]
        .find((b) => b.offsetParent);
      if (item) { item.click(); break; }
      await new Promise((r) => setTimeout(r, 50));
    }
    setTimeout(() => document.documentElement.classList.remove('tm-ni-busy'), 150);
  }

  function makeButton(preview) {
    // Built with DOM calls (not innerHTML, which YouTube's Trusted Types policy blocks),
    // reusing YouTube's mute-button classes so it looks identical.
    const el = (tag, cls) => Object.assign(document.createElement(tag), { className: cls });
    const circle = el('div', 'ytInlinePlayerControlsTopRightControlsCircleButton');
    const btn = el('button', 'ytmMuteButtonButton');
    btn.title = 'Not interested';
    btn.style.cursor = 'pointer';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.cssText = 'width: 24px; height: 24px; display: block; fill: currentColor;';
    svg.appendChild(document.createElementNS(svg.namespaceURI, 'path')).setAttribute('d', ICON);
    btn.append(svg);

    // Keep the click from reaching the preview, which would open the video.
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      notInterested(preview);
    });

    circle.append(el('div', 'ytInlinePlayerControlsButtonIcon'));
    circle.firstChild.append(btn);
    circle.dataset.tmNotInterested = '';
    return circle;
  }

  new MutationObserver(() => {
    const preview = document.querySelector('ytd-video-preview');
    const controls = preview?.querySelector('.ytInlinePlayerControlsTopRightControls');
    if (controls && !controls.querySelector('[data-tm-not-interested]')) controls.append(makeButton(preview));
  }).observe(document.body, { childList: true, subtree: true });
})();
