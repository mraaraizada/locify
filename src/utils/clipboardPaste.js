// Clipboard paste handler for images
export function setupClipboardPaste(onImagePaste) {
  const handlePaste = (event) => {
    const items = (event.clipboardData || event.originalEvent?.clipboardData)?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) {
        const blob = items[i].getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (evt) => {
            onImagePaste(blob, evt.target.result)
          }
          reader.readAsDataURL(blob)
          break
        }
      }
    }
  }

  document.addEventListener('paste', handlePaste)

  // Return cleanup function
  return () => {
    document.removeEventListener('paste', handlePaste)
  }
}
