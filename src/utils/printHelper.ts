/**
 * Clean Document Printing Utility for AHT Warehouse Management
 * Ensures official administrative documents (Báo cáo, Thẻ kho, Phiếu nhập/xuất)
 * print strictly from Logo & Title downwards, without browser-injected header (date/time/title)
 * or footer (http://... URL / page number).
 */

export function printCleanDocument(orientation: 'landscape' | 'portrait' = 'landscape') {
  const originalTitle = document.title;

  // Temporarily clear document title so browsers never print title in margin
  try {
    document.title = '';
  } catch {}

  // Inject dynamic @page rule with margin: 0 to force browsers (Chrome/Edge/Safari)
  // to eliminate the margin box completely, removing headers (date/time) and footers (URL/page).
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

