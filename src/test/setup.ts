// jsdom kennt showModal()/close() des <dialog>-Elements nicht vollständig.
// Dieser kleine Ersatz bildet nur das Verhalten nach, das die Tests brauchen.
if (typeof HTMLDialogElement !== 'undefined') {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  }
  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open')
    }
  }
}
