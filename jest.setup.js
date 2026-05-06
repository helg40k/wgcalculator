// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock window.matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// rc-table / Ant Design Table measure scrollbar (jsdom: pseudo-element getComputedStyle)
const originalGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (elt, pseudoElt) => {
  if (pseudoElt) {
    return {};
  }
  return originalGetComputedStyle(elt);
};

// Mock Firebase functions
const mockDeleteFieldValue = {};
jest.mock('firebase/firestore', () => {
  class Timestamp {
    constructor(seconds = 0, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
  }
  return {
    Timestamp,
    collection: jest.fn(),
    deleteDoc: jest.fn(),
    deleteField: jest.fn(() => mockDeleteFieldValue),
    doc: jest.fn(),
    documentId: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn(),
    serverTimestamp: jest.fn(() => ({ nanoseconds: 0, seconds: 1234567890 })),
    setDoc: jest.fn(),
    startAfter: jest.fn(),
    updateDoc: jest.fn(),
    where: jest.fn(),
  };
});

// Global test timeout
jest.setTimeout(10000)
