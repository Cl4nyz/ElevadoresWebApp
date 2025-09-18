import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-pdf
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children }) => <span data-testid="pdf-text">{children}</span>,
  View: ({ children }) => <div data-testid="pdf-view">{children}</div>,
  Image: ({ src }) => <img data-testid="pdf-image" src={src} alt="PDF Image" />,
  StyleSheet: {
    create: (styles) => styles,
  },
  PDFViewer: ({ children }) => <div data-testid="pdf-viewer">{children}</div>,
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Routes: ({ children }) => <div>{children}</div>,
    Route: ({ children }) => <div>{children}</div>,
    Link: ({ children, to }) => <a href={to}>{children}</a>
  };
});

// Mock window methods
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
});

// Mock fetch globally
global.fetch = vi.fn();

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});