/**
 * Copy text to clipboard using textarea and execCommand
 * 
 * This approach works reliably in content scripts where navigator.clipboard
 * may fail with "document not focused" errors.
 * 
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      
      // Style it to be invisible and non-intrusive
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      textarea.setAttribute('readonly', '');
      
      // Append to document
      document.body.appendChild(textarea);
      
      // Select the text
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      // Execute copy command
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
      
      resolve(successful);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      resolve(false);
    }
  });
};

