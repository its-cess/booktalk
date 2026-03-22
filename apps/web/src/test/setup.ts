import "@testing-library/jest-dom";

// Radix UI components (Checkbox, etc.) use ResizeObserver which isn't in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
