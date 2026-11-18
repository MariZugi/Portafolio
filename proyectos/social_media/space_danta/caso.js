const dialog = document.querySelector('#piece-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogTitle = document.querySelector('#dialog-title');
const dialogDownload = document.querySelector('#dialog-download');
document.querySelectorAll('.zoom-piece').forEach((button) => {
  button.addEventListener('click', () => {
    dialogImage.src = button.dataset.image;
    dialogImage.alt = button.querySelector('img').alt;
    dialogTitle.textContent = button.dataset.title;
    dialogDownload.href = button.dataset.image;
    dialog.showModal();
  });
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.series').forEach((series) => {
  const track = series.querySelector('.piece-track');
  const pieces = Array.from(track.children);
  const previous = series.querySelector('.track-prev');
  const next = series.querySelector('.track-next');
  const count = series.querySelector('.track-count');
  let index = 0;
  function update() {
    let smallest = Infinity;
    pieces.forEach((piece, candidate) => {
      const delta = Math.abs(piece.offsetLeft - pieces[0].offsetLeft - track.scrollLeft);
      if (delta < smallest) { smallest = delta; index = candidate; }
    });
    const atEnd = track.scrollWidth - track.clientWidth - track.scrollLeft < 3;
    previous.disabled = track.scrollLeft < 3;
    next.disabled = atEnd;
    const visible = pieces.filter((piece) => {
      const left = piece.offsetLeft - pieces[0].offsetLeft;
      return left < track.scrollLeft + track.clientWidth - 4 && left + piece.clientWidth > track.scrollLeft + 4;
    });
    const first = pieces.indexOf(visible[0]) + 1;
    const last = pieces.indexOf(visible.at(-1)) + 1;
    count.textContent = `${first === last ? first : first + '–' + last} / ${pieces.length}`;
  }
  function move(delta) {
    const target = pieces[Math.max(0, Math.min(pieces.length - 1, index + delta))];
    track.scrollTo({ left: target.offsetLeft - pieces[0].offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
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
