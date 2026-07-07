declare module '*.css?raw' {
  const content: string;
  export default content;
}

declare module 'streaming-markdown' {
  export function default_renderer(element: HTMLElement): unknown;
  export function parser(renderer: unknown): unknown;
  export function parser_write(target: unknown, chunk: string): void;
  export function parser_end(target: unknown): void;
}