import type { Core } from '@strapi/strapi';
import type { RequestInfo } from 'node-fetch';
import sharp from 'sharp';
import type { Config, RGBColor } from '../types';

interface FlattenOption {
  background: RGBColor | string;
}
export const getColor = (color: RGBColor | string | null | undefined): FlattenOption => {
  if (typeof color === 'undefined' || color === null) {
    return { background: 'white' };
  }
  return { background: color };
};

interface SharpProccessorProps {
  metadata: { width: number; height: number };
  pixels: ArrayBuffer;
}

const sharpProccessor = async (
  arrayBuffer: ArrayBuffer,
  opt: Config
): Promise<SharpProccessorProps> => {
  try {
    const preprocesss = sharp(arrayBuffer).ensureAlpha().resize(32, 32, { fit: 'inside' });

    const raw = !opt.flatten
      ? preprocesss.raw()
      : preprocesss.flatten(getColor(opt?.flattenColor)).raw();

    const { data: pixels, info: metadata } = await raw.toBuffer({ resolveWithObject: true });
    return { pixels, metadata };
  } catch (error) {
    throw error;
  }
};

const encodeImageToBlurhash = async (url: URL | RequestInfo, opt: Config): Promise<string> => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const { pixels, metadata } = await sharpProccessor(arrayBuffer, opt);
    const { width, height } = metadata || {};

    const Thumbhash = await import('thumbhash');
    const blurBuffer = Thumbhash.rgbaToThumbHash(width, height, Buffer.from(pixels));
    const blurhash = Buffer.from(blurBuffer).toString('base64');

    // const base64URL = Thumbhash.thumbHashToDataURL(
    //   Uint8Array.from(Buffer.from(blurhash, 'base64').toString('binary'), (c) => c.charCodeAt(0))
    // );
    // console.log(base64URL);
    return blurhash;
  } catch (error) {
    throw error;
  }
};

const blurGenerator = ({ strapi }: { strapi: Core.Strapi }) => ({
  async generateBlurhash(url: string, opt: Config = {}) {
    try {
      const blurhash = await encodeImageToBlurhash(url, opt);
      return blurhash;
    } catch (error) {
      strapi.log.error(`Error generating blurhash: ${error.message}`);
      throw error;
    }
  },
});

export default blurGenerator;
