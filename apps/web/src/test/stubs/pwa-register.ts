// Test-only stub for the `virtual:pwa-register/react` module that vite-plugin-pwa
// provides at build/dev time. The PWA plugin is disabled under Vitest, so this
// gives the import something to resolve to; individual tests override it with vi.mock.
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (v: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (v: boolean) => void],
    updateServiceWorker: async () => {},
  };
}
