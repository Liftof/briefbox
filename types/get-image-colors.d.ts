declare module 'get-image-colors' {
  interface Color {
    hex(): string;
    rgb(): { r: number; g: number; b: number };
    hsl(): { h: number; s: number; l: number };
  }

  function getColors(
    input: string | Buffer,
    options?: string | { type?: string; count?: number }
  ): Promise<Color[]>;

  export default getColors;
}

