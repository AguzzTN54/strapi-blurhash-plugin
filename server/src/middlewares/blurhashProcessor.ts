import sharp from 'sharp';
import axios from 'axios';
import type { Core } from '@strapi/strapi';
import type { Files, File } from 'formidable';
import type { Config, ColorConfig } from '../types';
import { PLUGIN_NAME, SUPPORTED_MIMES } from '../config';

type ColorContext = (color?: ColorConfig | string | null) => {
  background: ColorConfig | string;
};

const getColor: ColorContext = (color) => {
  if (color && (typeof color === 'object' || typeof color === 'string')) {
    return { background: color };
  }
  return { background: 'white' };
};

const fetchBuffer = async (url: string) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const arrayBuffer = response.data;
  return arrayBuffer;
};

const sharpBlurhashProcessor = async (file: string | ArrayBuffer, opt: Config) => {
  try {
    const preprocess = sharp(file).ensureAlpha().resize(32, 32, { fit: 'inside' });
    const raw = !opt.flatten
      ? preprocess.raw()
      : preprocess.flatten(getColor(opt?.flattenColor)).raw();

    const { data: pixels, info: metadata } = await raw.toBuffer({ resolveWithObject: true });
    preprocess.destroy();
    return { pixels, metadata };
  } catch (e) {
    throw e;
  }
};

interface GenerateProps {
  file?: File;
  url?: string;
  ctx: any;
}
const generateBlurhash = async (strapi: Core.Strapi, { file, url, ctx }: GenerateProps) => {
  try {
    const { config } = strapi.plugin(PLUGIN_NAME);
    const opt: Config = {
      flatten: config('flatten'),
      flattenColor: config('flattenColor'),
    };

    const sharpFile = url ? await fetchBuffer(url) : file.filepath;
    if (!sharpFile) throw Error('Not A Valid File Data!');

    const { metadata, pixels } = await sharpBlurhashProcessor(sharpFile, opt);
    const { width, height } = metadata || {};

    const Thumbhash = await import('thumbhash');
    const blurBuffer = Thumbhash.rgbaToThumbHash(width, height, Buffer.from(pixels));
    const blurhash = Buffer.from(blurBuffer).toString('base64') || '';
    ctx.state.blurhash = blurhash;
    return blurhash;
  } catch (e) {
    throw e;
  }
};

const blurhashHandler = async (strapi: Core.Strapi, file: File, ctx) => {
  const { mimetype, originalFilename: name } = file;
  const isSupported = mimetype && SUPPORTED_MIMES.includes(mimetype);
  if (!isSupported) return;
  const blurhash = await generateBlurhash(strapi, { file, ctx });
  if (!blurhash) return;
  strapi.log.info(`Blurhash for ${name} generated successfully: ${blurhash}`);
};

const processUpload = async (strapi: Core.Strapi, ctx) => {
  const files = ctx.request.files as Files;
  for (const key in files) {
    if (!Array.isArray(files[key])) {
      await blurhashHandler(strapi, files[key] as unknown as File, ctx);
    } else {
      for (const file of files[key]) {
        await blurhashHandler(strapi, file, ctx);
      }
    }
  }
};

const processUpdate = async (strapi: Core.Strapi, ctx) => {
  // Replace/Upload new Image, means regenerate blurhash
  const isNewFile = ctx.request?.files && Object.keys(ctx.request.files).length > 0;
  if (isNewFile) return processUpload(strapi, ctx);

  // Update Media without changing image
  const { config } = strapi.plugin(PLUGIN_NAME);
  const regenerateOnUpdate = config('regenerateOnUpdate');
  const forceRegenerateOnUpdate = config('forceRegenerateOnUpdate');

  if (forceRegenerateOnUpdate || regenerateOnUpdate) {
    const idParam = (ctx.URL as URL).searchParams.get('id') || null;
    const fullData = await strapi.db.query('plugin::upload.file').findOne({
      select: ['url', 'blurhash', 'name', 'mime'],
      where: { id: parseInt(idParam) },
    });

    const { mime, name, blurhash, url } = fullData || {};
    const isSupported = mime && SUPPORTED_MIMES.includes(mime);
    const isNeedUpdate = forceRegenerateOnUpdate || !blurhash;
    if (!(isNeedUpdate && isSupported)) return;

    // Generate Blurhash from Saved URL
    const newBlurhash = await generateBlurhash(strapi, { url, ctx });
    if (!newBlurhash) return;
    strapi.log.info(`Re-generate blurhash for ${name}: ${newBlurhash}`);
  }
};

const blurhashProcessor = (strapi: Core.Strapi): Core.MiddlewareHandler => {
  return async (ctx, next) => {
    const { body, method, url, files } = ctx.request;
    const isRequest = !!(body && method === 'POST' && (body.fileInfo || files));
    try {
      const isNewUpload = (url === '/upload' || url === '/api/upload') && files && isRequest;
      const isUpdateMedia = (url.startsWith('/upload?id=') || url.startsWith('/api/upload?id=')) && isRequest;
      if (isNewUpload) await processUpload(strapi, ctx);
      else if (isUpdateMedia) await processUpdate(strapi, ctx);
    } catch (e) {
      strapi.log.error('Error While Generating Blurhash', e);
    }
    await next();
  };
};

export default blurhashProcessor;
