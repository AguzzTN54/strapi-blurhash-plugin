import sharp from "sharp";
import fetch from "node-fetch";
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
    const { data: pixels, info: metadata } = await sharp(arrayBuffer).ensureAlpha().resize(32, 32, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
    return { pixels, metadata };
  } catch (error) {
    throw error;
  }
};
const encodeImageToBlurhash = async (url) => {
  try {
    const response = await fetch(url);
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
export {
  index as default
};
