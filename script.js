const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
const paths = document.querySelectorAll('.connection');
const hoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const work = document.querySelector('.work');
const projectNote = document.querySelector('#project-note');
const placeholderNote = 'Projects will be added here.';
const projectVideos = Array.from(document.querySelectorAll('.work video'));
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
    if (!hoverInput.matches || event.pointerType === 'touch' || (video.closest('.mosaic-multimedia') && window.matchMedia('(max-width: 720px)').matches)) return;
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

// Vertical mobile reels: only the centered, on-screen video may play.
const reelViewport = document.querySelector('#multimedia-reels');
const reelCards = Array.from(reelViewport.querySelectorAll('.video-tile'));
const reelVideos = reelCards.map((card) => card.querySelector('video'));
const reelMobile = window.matchMedia('(max-width: 720px)');
const reelPosition = document.querySelector('#reel-position');
const reelPrevious = document.querySelector('#reel-previous');
const reelNext = document.querySelector('#reel-next');
const reelPlayback = document.querySelector('#reel-playback');
const reelSound = document.querySelector('#reel-sound');
const reelHint = document.querySelector('#reel-instruction');
const reelRatios = new Map();
let reelIndex = 0;
let reelOnScreen = false;
let reelPausedByUser = false;
let reelSoundEnabled = false;

function updatePlaybackButtons() {
  const playing = !reelVideos[reelIndex].paused;
  reelPlayback.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
  reelPlayback.querySelector('[data-icon="play"]').toggleAttribute('hidden', playing);
  reelPlayback.querySelector('[data-icon="pause"]').toggleAttribute('hidden', !playing);
  reelSound.setAttribute('aria-label', reelSoundEnabled ? 'Turn sound off' : 'Turn sound on');
  reelSound.setAttribute('aria-pressed', String(reelSoundEnabled));
  reelSound.querySelector('[data-icon="muted"]').toggleAttribute('hidden', reelSoundEnabled);
  reelSound.querySelector('[data-icon="sound"]').toggleAttribute('hidden', !reelSoundEnabled);
}
function syncReelPlayback() {
  if (!reelMobile.matches) return;
  const current = reelVideos[reelIndex];
  const viewportBox = reelViewport.getBoundingClientRect();
  const cardBox = reelCards[reelIndex].getBoundingClientRect();
  const screenHeight = Math.max(0, Math.min(viewportBox.bottom, innerHeight) - Math.max(viewportBox.top, 0));
  const cardHeight = Math.max(0, Math.min(cardBox.bottom, viewportBox.bottom, innerHeight) - Math.max(cardBox.top, viewportBox.top, 0));
  reelOnScreen = viewportBox.height > 0 && screenHeight / viewportBox.height >= .65;
  const canPlay = reelOnScreen && !document.hidden && !reelViewport.closest('[hidden]') && cardBox.height > 0 && cardHeight / cardBox.height >= .65;
  reelVideos.forEach((video) => {
    if (video !== current || !canPlay || reelPausedByUser) video.pause();
  });
  if (!canPlay || reelPausedByUser || !current.paused) return;
  current.muted = !reelSoundEnabled;
  current.preload = 'auto';
  const intendedIndex = reelIndex;
  current.play().then(() => {
    if (intendedIndex !== reelIndex || !reelOnScreen || document.hidden || reelViewport.closest('[hidden]')) current.pause();
    reelHint.textContent = 'Swipe up for the next video · Tap video to pause';
    updatePlaybackButtons();
  }).catch((error) => {
    if (error.name === 'AbortError') return;
    if (!current.muted && error.name === 'NotAllowedError') {
      reelSoundEnabled = false;
      current.muted = true;
      updatePlaybackButtons();
      if (intendedIndex === reelIndex && reelOnScreen) current.play().catch(() => {});
    } else {
      reelHint.textContent = 'Tap the video or the play button to start';
    }
  });
}
function showReel(index) {
  const nextIndex = Math.max(0, Math.min(reelCards.length - 1, index));
  reelViewport.scrollTo({ top: reelCards[nextIndex].offsetTop - reelCards[0].offsetTop, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
}
function updateReel() {
  if (!reelMobile.matches || reelViewport.closest('[hidden]')) return;
  let closest = 0;
  let distance = Infinity;
  reelCards.forEach((card, index) => {
    const delta = Math.abs(card.offsetTop - reelCards[0].offsetTop - reelViewport.scrollTop);
    if (delta < distance) { distance = delta; closest = index; }
  });
  if (reelIndex !== closest) reelPausedByUser = false;
  reelIndex = closest;
  reelPosition.textContent = `${closest + 1} / ${reelCards.length}`;
  reelPrevious.disabled = closest === 0;
  reelNext.disabled = closest === reelCards.length - 1;
  syncReelPlayback();
  updatePlaybackButtons();
}
function toggleReelPlayback() {
  const current = reelVideos[reelIndex];
  reelPausedByUser = !current.paused;
  if (reelPausedByUser) current.pause();
  else syncReelPlayback();
  updatePlaybackButtons();
}
function configureReels() {
  reelVideos.forEach((video) => {
    video.pause();
    video.controls = !reelMobile.matches;
    video.disablePictureInPicture = reelMobile.matches;
    video.disableRemotePlayback = reelMobile.matches;
    if (reelMobile.matches) {
      video.muted = !reelSoundEnabled;
      video.defaultMuted = true;
      video.tabIndex = 0;
    } else {
      video.removeAttribute('tabindex');
    }
  });
  updateReel();
}
reelPrevious.addEventListener('click', () => showReel(reelIndex - 1));
reelNext.addEventListener('click', () => showReel(reelIndex + 1));
reelPlayback.addEventListener('click', toggleReelPlayback);
reelSound.addEventListener('click', () => {
  reelSoundEnabled = !reelSoundEnabled;
  reelVideos.forEach((video) => { video.muted = !reelSoundEnabled; });
  updatePlaybackButtons();
  syncReelPlayback();
});
reelVideos.forEach((video) => {
  video.addEventListener('click', () => { if (reelMobile.matches) toggleReelPlayback(); });
  video.addEventListener('keydown', (event) => {
    if (!reelMobile.matches || ![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    toggleReelPlayback();
  });
  video.addEventListener('play', updatePlaybackButtons);
  video.addEventListener('pause', updatePlaybackButtons);
});
let reelFrame;
reelViewport.addEventListener('scroll', () => {
  cancelAnimationFrame(reelFrame);
  reelFrame = requestAnimationFrame(updateReel);
}, { passive: true });
reelViewport.addEventListener('scrollend', updateReel);
reelViewport.addEventListener('keydown', (event) => {
  if (!reelMobile.matches || event.target !== reelViewport || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  showReel(event.key === 'Home' ? 0 : event.key === 'End' ? reelCards.length - 1 : reelIndex + (event.key === 'ArrowDown' ? 1 : -1));
});
const reelVisibility = new IntersectionObserver((entries) => {
  entries.forEach((entry) => reelRatios.set(entry.target, entry.intersectionRatio));
  updateReel();
}, { root: reelViewport, threshold: [0, .4, .65, .9] });
reelCards.forEach((card) => reelVisibility.observe(card));
const reelPageVisibility = new IntersectionObserver((entries) => {
  reelOnScreen = entries[0].intersectionRatio >= .65;
  syncReelPlayback();
}, { threshold: [0, .65] });
reelPageVisibility.observe(reelViewport);
new ResizeObserver(updateReel).observe(reelViewport);
reelMobile.addEventListener('change', configureReels);
document.addEventListener('visibilitychange', syncReelPlayback);
window.addEventListener('scroll', syncReelPlayback, { passive: true });
new MutationObserver(() => { updateReel(); syncReelPlayback(); }).observe(document.querySelector('#panel-multimedia'), { attributes: true, attributeFilter: ['hidden'] });
configureReels();

// Graphic collections: native horizontal swipe, accessible navigation, and full view.
document.querySelectorAll('[data-graphic-gallery]').forEach((gallery) => {
  const track = gallery.querySelector('.graphic-track');
  const cards = Array.from(track.querySelectorAll('.graphic-piece'));
  const previous = gallery.querySelector('[data-graphic-previous]');
  const next = gallery.querySelector('[data-graphic-next]');
  const count = gallery.querySelector('.graphic-count');
  let index = 0;
  function update() {
    if (!track.clientWidth) return;
    let distance = Infinity;
    const visible = [];
    cards.forEach((card, candidate) => {
      const left = card.offsetLeft - cards[0].offsetLeft;
      const delta = Math.abs(left - track.scrollLeft);
      if (delta < distance) { distance = delta; index = candidate; }
      if (left < track.scrollLeft + track.clientWidth - 4 && left + card.clientWidth > track.scrollLeft + 4) visible.push(candidate + 1);
    });
    previous.disabled = track.scrollLeft < 3;
    next.disabled = track.scrollWidth - track.clientWidth - track.scrollLeft < 3;
    count.textContent = `${visible[0] === visible.at(-1) ? visible[0] : visible[0] + '–' + visible.at(-1)} / ${cards.length}`;
  }
  function move(delta) {
    const card = cards[Math.max(0, Math.min(cards.length - 1, index + delta))];
    track.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', (event) => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  let frame;
  track.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); }, { passive: true });
  new ResizeObserver(update).observe(track);
  update();
});
const graphicDialog = document.querySelector('#graphic-dialog');
if (graphicDialog) {
  document.querySelectorAll('[data-graphic-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const original = button.querySelector('img');
      const image = graphicDialog.querySelector('img');
      image.src = button.dataset.full;
      image.alt = original.alt;
      graphicDialog.querySelector('h2').textContent = button.dataset.title;
      graphicDialog.querySelector('a').href = button.dataset.source;
      graphicDialog.showModal();
    });
  });
  graphicDialog.querySelector('button').addEventListener('click', () => graphicDialog.close());
  graphicDialog.addEventListener('click', (event) => {
    if (event.target !== graphicDialog) return;
    const box = graphicDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) graphicDialog.close();
  });
}
