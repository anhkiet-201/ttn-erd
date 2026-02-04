export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    // 1. Try modern Clipboard API first (requires secure context)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API not available');
  } catch (err) {
    // 2. Fallback to document.execCommand('copy')
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (fallbackErr) {
      console.error('Failed to copy text:', fallbackErr);
      return false;
    }
  }
}
