// Triggers a browser download for a blob response fetched via axios (blob
// responses can't be downloaded with a plain <a href> since the request
// needs the Authorization header the api client attaches).
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
