export function showAlert(type, msg) {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector(`body`).insertAdjacentHTML(`afterbegin`, markup);
}

export function hideAlert() {
  const el = document.querySelector(`.alert`);
  if (el) {
    return el.parentElement.removeChild(el);
  }
  window.setTimeout(function() {
    hideAlert();
  }, 5_000);
}


