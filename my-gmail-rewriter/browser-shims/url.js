// Browser shim for url module (not used in browser environment)
export function pathToFileURL() {
  throw new Error('url.pathToFileURL is not available in browser');
}

export function fileURLToPath() {
  throw new Error('url.fileURLToPath is not available in browser');
}
