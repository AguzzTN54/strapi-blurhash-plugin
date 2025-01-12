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
const fetch = require("node-fetch");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const sharp__default = /* @__PURE__ */ _interopDefault(sharp);
const fetch__default = /* @__PURE__ */ _interopDefault(fetch);
const pluginName = "strapi-blurhash-plugin";
const generateURL = ({ url, host, port, hash, mime }) => {
  const isHttp = url.startsWith("http");
  const mainImgURL = isHttp ? url : `${"http://" + host + ":" + port}${url}`;
  const isSVG = mime.match(/(svg|avif)/);
  const targetURL = isSVG ? mainImgURL : mainImgURL.replace(hash, `thumbnail_${hash}`);
  return targetURL;
};
const beforeUpdateHandler = async (strapi, props) => {
  console.log("beforeUpdateHandler");
  const { data, where, host, port } = props;
  const regenerateOnUpdate = strapi.plugin(pluginName).config("regenerateOnUpdate");
  const forceRegenerateOnUpdate = strapi.plugin(pluginName).config("forceRegenerateOnUpdate");
  console.log(
    `update config - regenerateOnUpdate: ${regenerateOnUpdate}`,
    `forceRegenerateOnUpdate: ${forceRegenerateOnUpdate}`
  );
  const fullData = await strapi.db.query("plugin::upload.file").findOne({
    select: ["url", "blurhash", "name", "mime", "hash"],
    where
  });
  const { mime, url, hash, name, blurhash: blurhash2 } = fullData || {};
  console.log(`found existing file: ${name}`);
  const isImage = mime.startsWith("image/");
  const isNeedUpdate = forceRegenerateOnUpdate || !blurhash2 && regenerateOnUpdate;
  if (!(isImage && isNeedUpdate)) return;
  const targetURL = generateURL({ hash, host, port, url, mime });
  console.log(`regenerating blurhash for image: ${targetURL}`);
  data.blurhash = await strapi.plugin(pluginName).service("blurhash").generateBlurhash(targetURL);
  console.log(`blurhash regenerated successfully: ${data.blurhash}`);
};
const createHandler = async (strapi, props) => {
  const { data, host, port } = props;
  const { url, hash, mime } = data;
  const targetURL = generateURL({ hash, host, port, url, mime });
  console.log(`generating blurhash for image: ${targetURL}`);
  data.blurhash = await strapi.plugin(pluginName).service("blurhash").generateBlurhash(targetURL);
  console.log(`blurhash generated successfully: ${data.blurhash}`);
};
const blurhashHandler = async (strapi, event, cycleType) => {
  console.log(`generating blurhash for ${cycleType} event`);
  const { data, where } = event.params;
  const host = strapi.config.get("server.host", "localhost");
  const port = strapi.config.get("server.port", 1337);
  console.log(`server config - host: ${host}, port: ${port}`);
  const isImage = data.mime && data.mime.startsWith("image/");
  if (isImage) await createHandler(strapi, { data, host, port });
  if (cycleType !== "beforeUpdate") return;
  await beforeUpdateHandler(strapi, { data, where, host, port });
};
const bootstrap = ({ strapi }) => {
  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],
    beforeCreate: (event) => blurhashHandler(strapi, event, "beforeCreate"),
    beforeUpdate: (event) => blurhashHandler(strapi, event, "beforeUpdate")
  });
  console.log("strapi-blurhash-plugin plugin bootstrap completed");
};
const register = ({ strapi }) => {
  const fileData = strapi.plugin("upload").contentTypes.file;
  if (!fileData) return;
  fileData.attributes.blurhash = {
    type: "text"
  };
};
const config = {
  default: {
    regenerateOnUpdate: false,
    forceRegenerateOnUpdate: false
  },
  validator: (config2) => {
    if (typeof config2.regenerateOnUpdate !== "boolean") {
      throw new Error("regenerateOnUpdate has to be a boolean");
    }
    if (typeof config2.forceRegenerateOnUpdate !== "boolean") {
      throw new Error("forceRegenerateOnUpdate has to be a boolean");
    }
  }
};
const sharpProccessor = async (arrayBuffer) => {
  try {
    const { data: pixels, info: metadata } = await sharp__default.default(arrayBuffer).ensureAlpha().resize(32, 32, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
    return { pixels, metadata };
  } catch (error) {
    throw error;
  }
};
const encodeImageToBlurhash = async (url) => {
  try {
    const response = await fetch__default.default(url);
    const arrayBuffer = await response.arrayBuffer();
    const { pixels, metadata } = await sharpProccessor(arrayBuffer);
    const { width, height } = metadata || {};
    const Thumbhash = await import("thumbhash");
    const blurBuffer = Thumbhash.rgbaToThumbHash(width, height, Buffer.from(pixels));
    const blurhash2 = Buffer.from(blurBuffer).toString("base64");
    return blurhash2;
  } catch (error) {
    throw error;
  }
};
const blurhash = ({ strapi }) => ({
  async generateBlurhash(url) {
    try {
      const blurhash2 = await encodeImageToBlurhash(url);
      return blurhash2;
    } catch (error) {
      strapi.log.error(`Error generating blurhash: ${error.message}`);
      throw error;
    }
  }
});
const services = {
  blurhash
};
const index = {
  register,
  bootstrap,
  services,
  config
};
module.exports = index;
