interface RGBColor {
  r: number;
  g: number;
  b: number;
  // alpha?: number;
}

export interface Config {
  regenerateOnUpdate?: boolean;
  forceRegenerateOnUpdate?: boolean;
  flatten?: boolean;
  flattenColor?: null | RGBColor | string;
}

export interface BlurhashConfig {
  blurhash: {
    enabled?: boolean;
    resolve?: string;
    config?: Config;
  };
}
