/**
 * Clean Document Printing Utility for AHT Warehouse Management
 * Ensures official administrative documents (Báo cáo, Thẻ kho, Phiếu nhập/xuất)
 * print strictly from Logo & Title downwards, without browser-injected header (date/time/title)
 * or footer (http://... URL / page number).
 */

export interface PrintDocumentOptions {
  title?: string;
  content?: string;
  orientation?: 'landscape' | 'portrait';
}

export function printCleanDocument(
  param: 'landscape' | 'portrait' | PrintDocumentOptions = 'landscape'
) {
  const options: PrintDocumentOptions =
    typeof param === 'string' ? { orientation: param } : param;
  const orientation = options.orientation || 'landscape';

  // If specific HTML content was provided, print it via an isolated hidden iframe
  if (options.content) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${options.title || ''}</title>
            <style>
              @page {
                size: A4 ${orientation} !important;
                margin: 8mm !important;
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                margin: 0;
                padding: 10px;
                color: #0f172a;
                background: #fff;
              }
            </style>
          </head>
          <body>
            ${options.content}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 3000);
      }, 350);
      return;
    }
  }

  // Otherwise, clean print of the current document viewport
  const originalTitle = document.title;
  try {
    document.title = '';
  } catch {}

  const styleId = 'dynamic-print-aht-rules';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @page {
      size: A4 ${orientation} !important;
      margin: 0mm !important;
    }
    @media print {
      @page {
        size: A4 ${orientation} !important;
        margin: 0mm !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `;

  const cleanup = () => {
    try {
      document.title = originalTitle;
    } catch {}
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  requestAnimationFrame(() => {
    window.print();
    setTimeout(cleanup, 2500);
  });
}
