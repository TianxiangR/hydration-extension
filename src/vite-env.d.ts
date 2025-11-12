/// <reference types="vite/client" />

// SVG imports
declare module '*.svg' {
  const content: string;
  export default content;
}

// CSS imports
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

