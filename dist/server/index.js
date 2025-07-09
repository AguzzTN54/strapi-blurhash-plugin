"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const sharp = require("sharp");
const axios = require("axios");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const sharp__default = /* @__PURE__ */ _interopDefault(sharp);
const axios__default = /* @__PURE__ */ _interopDefault(axios);
const PLUGIN_NAME = "blurhash";
const SUPPORTED_MIMES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/avif",
  "image/webp",
  "image/svg",
  "image/gif"
];
const config = {
  default: {
    regenerateOnUpdate: false,
    forceRegenerateOnUpdate: false,
    flatten: false,
    flattenColor: "white"
  },
  validator: (config2) => {
    const { flatten, flattenColor: bg, forceRegenerateOnUpdate, regenerateOnUpdate } = config2 || {};
    if (typeof regenerateOnUpdate !== "boolean") {
      throw new Error("regenerateOnUpdate has to be a boolean");
    }
    if (typeof forceRegenerateOnUpdate !== "boolean") {
      throw new Error("forceRegenerateOnUpdate has to be a boolean");
    }
    if (typeof flatten !== "boolean") {
      throw new Error("flatten has to be a boolean");
    }
    if (flatten && bg) {
      if (typeof bg === "object") {
        const bgValTypes = [];
        Object.keys(bg).forEach((k) => bgValTypes.push(typeof bg[k] === "number"));
        if (bgValTypes.includes(false)) {
          throw new Error("flattenColor attributes should be number");
        }
      }
      if (!((typeof bg).match(/(string|object|undefined)/) || bg === null)) {
        throw new Error("flattenColor not a valid Color Format");
      }
    }
  }
};
const getColor = (color) => {
  if (color && (typeof color === "object" || typeof color === "string")) {
    return { background: color };
  }
  return { background: "white" };
};
const fetchBuffer = async (url) => {
  const response = await axios__default.default.get(url, { responseType: "arraybuffer" });
  const arrayBuffer = response.data;
  return arrayBuffer;
};
const sharpBlurhashProcessor = async (file, opt) => {
  try {
    const preprocess = sharp__default.default(file).ensureAlpha().resize(32, 32, { fit: "inside" });
    const raw = !opt.flatten ? preprocess.raw() : preprocess.flatten(getColor(opt?.flattenColor)).raw();
    const { data: pixels, info: metadata } = await raw.toBuffer({ resolveWithObject: true });
    preprocess.destroy();
    return { pixels, metadata };
  } catch (e) {
    throw e;
  }
};
const generateBlurhash = async (strapi, { file, url, ctx }) => {
  try {
    const { config: config2 } = strapi.plugin(PLUGIN_NAME);
    const opt = {
      flatten: config2("flatten"),
      flattenColor: config2("flattenColor")
    };
    const sharpFile = url ? await fetchBuffer(url) : file.filepath;
    if (!sharpFile) throw Error("Not A Valid File Data!");
    const { metadata, pixels } = await sharpBlurhashProcessor(sharpFile, opt);
    const { width, height } = metadata || {};
    const Thumbhash = await import("thumbhash");
    const blurBuffer = Thumbhash.rgbaToThumbHash(width, height, Buffer.from(pixels));
    const blurhash = Buffer.from(blurBuffer).toString("base64") || "";
    ctx.state.blurhash = blurhash;
    return blurhash;
  } catch (e) {
    throw e;
  }
};
const blurhashHandler$1 = async (strapi, file, ctx) => {
  const { mimetype, originalFilename: name } = file;
  const isSupported = mimetype && SUPPORTED_MIMES.includes(mimetype);
  if (!isSupported) return;
  const blurhash = await generateBlurhash(strapi, { file, ctx });
  if (!blurhash) return;
  strapi.log.info(`Blurhash for ${name} generated successfully: ${blurhash}`);
};
const processUpload = async (strapi, ctx) => {
  const files = ctx.request.files;
  for (const key in files) {
    if (!Array.isArray(files[key])) {
      await blurhashHandler$1(strapi, files[key], ctx);
    } else {
      for (const file of files[key]) {
        await blurhashHandler$1(strapi, file, ctx);
      }
    }
  }
};
const processUpdate = async (strapi, ctx) => {
  const isNewFile = ctx.request?.files && Object.keys(ctx.request.files).length > 0;
  if (isNewFile) return processUpload(strapi, ctx);
  const { config: config2 } = strapi.plugin(PLUGIN_NAME);
  const regenerateOnUpdate = config2("regenerateOnUpdate");
  const forceRegenerateOnUpdate = config2("forceRegenerateOnUpdate");
  if (forceRegenerateOnUpdate || regenerateOnUpdate) {
    const idParam = ctx.URL.searchParams.get("id") || null;
    const fullData = await strapi.db.query("plugin::upload.file").findOne({
      select: ["url", "blurhash", "name", "mime"],
      where: { id: parseInt(idParam) }
    });
    const { mime, name, blurhash, url } = fullData || {};
    const isSupported = mime && SUPPORTED_MIMES.includes(mime);
    const isNeedUpdate = forceRegenerateOnUpdate || !blurhash;
    if (!(isNeedUpdate && isSupported)) return;
    const newBlurhash = await generateBlurhash(strapi, { url, ctx });
    if (!newBlurhash) return;
    strapi.log.info(`Re-generate blurhash for ${name}: ${newBlurhash}`);
  }
};
const blurhashProcessor = (strapi) => {
  return async (ctx, next) => {
    const { body, method, url, files } = ctx.request;
    const isRequest = !!(body && method === "POST" && body.fileInfo);
    try {
      const isNewUpload = url === "/upload" && files && isRequest;
      const isUpdateMedia = url.startsWith("/upload?id=") && isRequest;
      if (isNewUpload) await processUpload(strapi, ctx);
      else if (isUpdateMedia) await processUpdate(strapi, ctx);
    } catch (e) {
      strapi.log.error("Error While Generating Blurhash", e);
    }
    await next();
  };
};
const middlewares = {
  blurhashProcessor
};
const blurhashHandler = async (strapi, event) => {
  const { blurhash } = strapi.requestContext.get().state;
  const { data } = event.params;
  const isSupported = data.mime && SUPPORTED_MIMES.includes(data.mime);
  if (!isSupported && blurhash) return;
  data.blurhash = blurhash;
};
const bootstrap = ({ strapi }) => {
  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],
    beforeCreate: (event) => blurhashHandler(strapi, event),
    beforeUpdate: (event) => blurhashHandler(strapi, event)
  });
  strapi.server.use(middlewares.blurhashProcessor(strapi));
};
const register = ({ strapi }) => {
  const fileData = strapi.plugin("upload").contentTypes.file;
  if (!fileData) return;
  fileData.attributes.blurhash = { type: "text" };
};
const index = {
  register,
  bootstrap,
  config
};
module.exports = index;
