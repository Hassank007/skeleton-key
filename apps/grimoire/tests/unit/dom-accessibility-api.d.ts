// dom-accessibility-api ships types that do not resolve under "moduleResolution": "bundler".
// This declares the one function the property tests use.
declare module 'dom-accessibility-api' {
  export function computeAccessibleName(root: Element, options?: Record<string, unknown>): string
}