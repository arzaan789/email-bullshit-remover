// Browser shim for path module (not used in browser environment)
export function dirname() {
  throw new Error('path.dirname is not available in browser');
}

export default { dirname };
