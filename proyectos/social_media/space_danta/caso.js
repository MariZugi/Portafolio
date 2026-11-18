const dialog = document.querySelector('#piece-dialog');
const image = document.querySelector('#dialog-image');
document.querySelectorAll('.zoom-piece').forEach((button) => {
  button.addEventListener('click', () => {
    image.src = button.dataset.image;
    image.alt = button.querySelector('img').alt;
    document.querySelector('#dialog-title').textContent = button.dataset.title;
    dialog.showModal();
  });
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
const art = document.querySelector('#layer-art');
const controls = document.querySelector('.layer-controls');
const status = document.querySelector('.layer-status');
function connectLayers() {
  let svg;
  try { svg = art.contentDocument; } catch { return; }
  if (!svg?.querySelector('[data-layer]')) return;
  controls.disabled = false;
  status.textContent = 'Todas las capas están visibles.';
  controls.querySelectorAll('input').forEach((input) => {
    input.checked = true;
    input.onchange = () => {
      input.dataset.layers.split(' ').forEach((name) => {
        svg.querySelectorAll(`[data-layer="${name}"]`).forEach((layer) => {
          layer.style.display = input.checked ? '' : 'none';
        });
      });
      const visible = controls.querySelectorAll('input:checked').length;
      status.textContent = visible === 4 ? 'Todas las capas están visibles.' : `${visible} de 4 grupos de capas visibles.`;
    };
  });
}
art.addEventListener('load', connectLayers);
connectLayers();
