/**
 * Clean Document Printing Utility for AHT Warehouse Management
 * Ensures official administrative documents (Báo cáo, Thẻ kho, Phiếu nhập/xuất)
 * print strictly from Logo & Title downwards, without browser-injected header (date/time/title)
 * or footer (http://... URL / page number).
 */

export function printCleanDocument() {
  const originalTitle = document.title;
  
  // Blank the document title temporarily so browsers with header print enabled won't print the page title
  try {
    document.title = '';
  } catch {}

  const cleanup = () => {
    try {
      document.title = originalTitle;
    } catch {}
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Give DOM a frame to settle, then open browser print dialog
  requestAnimationFrame(() => {
    window.print();
    // Fallback restoration in case afterprint does not fire in some browsers
    setTimeout(cleanup, 2000);
  });
}
