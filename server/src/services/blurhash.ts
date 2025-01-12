import type { Core } from '@strapi/strapi';
import type { RequestInfo } from 'node-fetch';
import sharp from 'sharp';

interface SharpProccessorProps {
  metadata: { width: number; height: number };
  pixels: ArrayBuffer;
}
const sharpProccessor = async (arrayBuffer: ArrayBuffer): Promise<SharpProccessorProps> => {
  try {
    const { data: pixels, info: metadata } = await sharp(arrayBuffer)
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { pixels, metadata };
  } catch (error) {
    throw error;
  }
};

const encodeImageToBlurhash = async (url: URL | RequestInfo): Promise<string> => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const { pixels, metadata } = await sharpProccessor(arrayBuffer);
    const { width, height } = metadata || {};

    const Thumbhash = await import('thumbhash');
    const blurBuffer = Thumbhash.rgbaToThumbHash(width, height, Buffer.from(pixels));
    const blurhash = Buffer.from(blurBuffer).toString('base64');
    return blurhash;
  } catch (error) {
    throw error;
  }
};

const blurhash = ({ strapi }: { strapi: Core.Strapi }) => ({
  async generateBlurhash(url: string) {
    try {
      const blurhash = await encodeImageToBlurhash(url);
      return blurhash;
    } catch (error) {
      strapi.log.error(`Error generating blurhash: ${error.message}`);
      throw error;
    }
  },
});

export default blurhash;
