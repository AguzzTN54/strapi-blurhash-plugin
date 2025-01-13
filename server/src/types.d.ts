interface ColorConfig {
  r?: number;
  g?: number;
  b?: number;
  // alpha?: number;
  h?: number;
  s?: number;
  l?: number;
  v?: number;
  c?: number;
  m?: number;
  y?: number;
  k?: number;
  a?: number;
}

export interface Config {
  regenerateOnUpdate?: boolean;
  forceRegenerateOnUpdate?: boolean;
  flatten?: boolean;
  flattenColor?: null | ColorConfig | string;
}

export interface BlurhashConfig {
  blurhash: {
    enabled?: boolean;
    resolve?: string;
    config?: Config;
  };
}
