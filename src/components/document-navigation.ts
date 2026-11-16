/** Select the document's loading copy before static HTML can paint. */
export const documentNavigationScript =
  'document.documentElement.dataset.documentNavigation=performance.getEntriesByType("navigation")[0]?.type||"navigate";';
