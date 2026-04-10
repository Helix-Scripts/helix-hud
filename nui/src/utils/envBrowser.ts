/**
 * Returns true when running in a regular browser (dev mode)
 * rather than inside FiveM's CEF/NUI environment.
 */
export function isEnvBrowser(): boolean {
  return !(window as any).invokeNative;
}
