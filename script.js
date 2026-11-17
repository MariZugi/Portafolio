const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
const paths = document.querySelectorAll('.connection');
const hoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const work = document.querySelector('.work');
const projectNote = document.querySelector('#project-note');
const placeholderNote = projectNote.textContent;
const projectVideos = Array.from(document.querySelectorAll('.video-tile video'));
const description = document.querySelector('#category-description');
const generalDescription = description.textContent;
const WORD_INTERVAL_MS = 120;
const categoryDescriptions = {
  'tab-social': 'I translate brand stories into visual content shaped by their audiences, combining thoughtful composition, clear communication, and audiovisual storytelling.',
  'tab-multimedia': 'I turn research and creative concepts into video, interactive visuals, and multimedia experiences, connecting people, stories, art, and technology.',
  'tab-3d': 'I bring ideas into three dimensions, building 3D elements and blending them with live-action footage to create visual stories rooted in each project’s concept.',
};

function renderSplitText(element, text, startDelay = 0) {
  const accessibleText = document.createElement('span');
  accessibleText.className = 'sr-only';
  accessibleText.textContent = text;
  const visualText = document.createElement('span');
  visualText.setAttribute('aria-hidden', 'true');
  let wordIndex = 0;
  text.split(/(\s+)/).forEach((part) => {
    if (/^\s+$/.test(part)) {
      visualText.append(document.createTextNode(part));
      return;
    }
    const word = document.createElement('span');
    word.className = 'split-word';
    word.textContent = part;
    word.style.setProperty('--word-delay', `${startDelay + wordIndex * WORD_INTERVAL_MS}ms`);
    visualText.append(word);
    wordIndex += 1;
  });
  element.replaceChildren(accessibleText, visualText);
  element.dataset.text = text;
  return startDelay + wordIndex * WORD_INTERVAL_MS;
}

let nextWordDelay = 1000;
document.querySelectorAll('.intro-phrase').forEach((phrase) => {
  nextWordDelay = renderSplitText(phrase, phrase.textContent, nextWordDelay);
});
renderSplitText(description, generalDescription, nextWordDelay);

function updateDescription(text) {
  if (description.dataset.text === text) return;
  renderSplitText(description, text);
}

document.addEventListener('pointerdown', (event) => {
  if (!work.contains(event.target)) {
    work.classList.remove('is-revealed');
    updateDescription(generalDescription);
  }
});
work.addEventListener('pointerleave', () => {
  const keyboardFocus = work.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
  if (!keyboardFocus && !work.classList.contains('is-revealed')) {
    updateDescription(generalDescription);
  }
});
work.addEventListener('focusout', (event) => {
  if (!work.contains(event.relatedTarget)) {
    work.classList.remove('is-revealed');
    updateDescription(generalDescription);
  }
});

function activateTab(tab, force = false) {
  // Preserve keyboard focus inside an open panel while the pointer moves.
  if (!force && panels.some((panel) => panel.contains(document.activeElement))) return;

  tabs.forEach((candidate) => {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected));
    candidate.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute('aria-controls');
    if (panel.hidden) panel.querySelectorAll('video').forEach((video) => video.pause());
  });
  const selectedPanel = document.getElementById(tab.getAttribute('aria-controls'));
  projectNote.textContent = selectedPanel.dataset.note || placeholderNote;
  updateDescription(categoryDescriptions[tab.id]);
}

projectVideos.forEach((video) => {
  let hoverPlayback = false;

  video.addEventListener('pointerenter', (event) => {
    if (!hoverInput.matches || event.pointerType === 'touch') return;
    hoverPlayback = true;
    video.muted = true;
    // Playback can be interrupted when the pointer quickly leaves the video.
    video.play().catch(() => {});
  });

  video.addEventListener('pointerleave', () => {
    if (!hoverPlayback) return;
    hoverPlayback = false;
    video.pause();
  });
});

document.addEventListener('play', (event) => {
  if (!projectVideos.includes(event.target)) return;
  projectVideos.forEach((video) => {
    if (video !== event.target) video.pause();
  });
}, true);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) projectVideos.forEach((video) => video.pause());
});

tabs.forEach((tab, index) => {
  tab.addEventListener('pointerenter', () => {
    if (hoverInput.matches) activateTab(tab);
  });
  tab.addEventListener('focus', () => activateTab(tab));
  tab.addEventListener('click', () => {
    activateTab(tab, true);
    if (!hoverInput.matches) work.classList.add('is-revealed');
  });
  tab.addEventListener('keydown', (event) => {
    let nextIndex;
    switch (event.key) {
      case 'ArrowRight': nextIndex = (index + 1) % tabs.length; break;
      case 'ArrowLeft': nextIndex = (index - 1 + tabs.length) % tabs.length; break;
      case 'Home': nextIndex = 0; break;
      case 'End': nextIndex = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    tabs[nextIndex].focus();
  });
});

// Animate the variable font axes while reserving each letter's widest advance.
const categoryList = document.querySelector('.categories');
const proximityLetters = [];
tabs.forEach((tab) => {
  const label = tab.querySelector('span:first-child');
  const text = label.textContent;
  tab.setAttribute('aria-label', text);
  label.setAttribute('aria-hidden', 'true');
  label.className = 'category-label';
  label.replaceChildren();
  text.split(/(\s+)/).forEach((part) => {
    if (/^\s+$/.test(part)) {
      label.append(document.createTextNode(part));
      return;
    }
    const word = document.createElement('span');
    word.className = 'proximity-word';
    Array.from(part).forEach((character) => {
      const letter = document.createElement('span');
      letter.className = 'proximity-letter';
      letter.textContent = character;
      word.append(letter);
      proximityLetters.push(letter);
    });
    label.append(word);
  });
});

function measureLetters() {
  proximityLetters.forEach((letter) => {
    letter.style.transition = 'none';
    letter.style.width = '';
    letter.style.fontVariationSettings = '"wght" 680, "opsz" 24';
  });
  const widths = proximityLetters.map((letter) => letter.getBoundingClientRect().width);
  proximityLetters.forEach((letter, index) => {
    letter.style.width = `${widths[index]}px`;
    letter.style.fontVariationSettings = '';
    letter.style.transition = '';
  });
}

let proximityFrame;
categoryList.addEventListener('pointermove', (event) => {
  if (!hoverInput.matches || reducedMotion.matches) return;
  cancelAnimationFrame(proximityFrame);
  proximityFrame = requestAnimationFrame(() => {
    const strengths = proximityLetters.map((letter) => {
      const box = letter.getBoundingClientRect();
      const distance = Math.hypot(event.clientX - box.x - box.width / 2, event.clientY - box.y - box.height / 2);
      return Math.max(0, 1 - distance / 110) ** 2;
    });
    proximityLetters.forEach((letter, index) => {
      letter.style.fontVariationSettings = `"wght" ${400 + strengths[index] * 280}, "opsz" 24`;
    });
  });
});
categoryList.addEventListener('pointerleave', () => {
  cancelAnimationFrame(proximityFrame);
  proximityLetters.forEach((letter) => { letter.style.fontVariationSettings = ''; });
});
document.fonts.ready.then(measureLetters);
new ResizeObserver(measureLetters).observe(categoryList);

const titlePath = document.querySelector('.connection-title');
const copyPath = document.querySelector('.connection-copy');
const categoryPath = document.querySelector('.connection-categories');
const titleDot = document.querySelector('.endpoint-title');
const copyDot = document.querySelector('.endpoint-copy');
const categoryDot = document.querySelector('.endpoint-categories');

function positionConnections() {
  const intro = document.querySelector('.intro');
  const logo = document.querySelector('.logo');
  const identity = document.querySelector('.identity');
  const copy = document.querySelector('.introduction');
  const originX = logo.offsetLeft + logo.offsetWidth / 2;
  const originY = logo.offsetTop + logo.offsetHeight / 2;
  const titleX = identity.offsetLeft + 10;
  const titleY = identity.offsetTop - 22;
  const bendX = titleX + Math.min(140, intro.clientWidth * .25);
  const copyX = copy.offsetLeft + 10;
  const copyY = copy.offsetTop - 22;
  const categoryX = intro.clientWidth * .17;
  const categoryY = intro.clientHeight - 15;
  const railX = Math.min(originX, Math.max(4, identity.offsetLeft - 14));

  document.querySelector('.connections').setAttribute('viewBox', `0 0 ${intro.clientWidth} ${intro.clientHeight}`);
  titlePath.setAttribute('d', `M${originX} ${originY} H${bendX} V${titleY} H${titleX}`);
  copyPath.setAttribute('d', `M${originX} ${originY} H${railX} V${copyY} H${copyX}`);
  categoryPath.setAttribute('d', `M${originX} ${originY} H${railX} V${categoryY} H${categoryX}`);
  [[titleDot, titleX, titleY], [copyDot, copyX, copyY], [categoryDot, categoryX, categoryY]].forEach(([dot, x, y]) => {
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', '4');
  });
}

positionConnections();
const connectionObserver = new ResizeObserver(positionConnections);
['.intro', '.identity', '.introduction'].forEach((selector) => {
  connectionObserver.observe(document.querySelector(selector));
});
document.fonts.ready.then(positionConnections);
paths.forEach((path) => path.setAttribute('pathLength', '1'));
document.documentElement.classList.add('motion-ready');
