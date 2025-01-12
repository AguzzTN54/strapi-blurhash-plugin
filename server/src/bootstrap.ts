import { Core } from '@strapi/strapi';

interface HandlerProps {
  data: { blurhash: string; url: string; hash: string; mime: string };
  where?: object;
  host: string;
  port: number;
}

const pluginName = 'blurhash';

const generateURL = ({ url, host, port, hash, mime }) => {
  const isHttp = url.startsWith('http');
  const mainImgURL = isHttp ? url : `${'http://' + host + ':' + port}${url}`;
  const isSVG = mime.match(/(svg|avif)/);
  const targetURL = isSVG ? mainImgURL : mainImgURL.replace(hash, `thumbnail_${hash}`);
  return targetURL;
};

const beforeUpdateHandler = async (strapi: Core.Strapi, props: HandlerProps) => {
  console.log('beforeUpdateHandler');
  const { data, where, host, port } = props;
  const regenerateOnUpdate = strapi.plugin(pluginName).config('regenerateOnUpdate');
  const forceRegenerateOnUpdate = strapi.plugin(pluginName).config('forceRegenerateOnUpdate');

  console.log(
    `update config - regenerateOnUpdate: ${regenerateOnUpdate}`,
    `forceRegenerateOnUpdate: ${forceRegenerateOnUpdate}`
  );

  const fullData = await strapi.db.query('plugin::upload.file').findOne({
    select: ['url', 'blurhash', 'name', 'mime', 'hash'],
    where,
  });

  const { mime, url, hash, name, blurhash } = fullData || {};
  console.log(`found existing file: ${name}`);

  const isImage = mime.startsWith('image/');
  const isNeedUpdate = forceRegenerateOnUpdate || (!blurhash && regenerateOnUpdate);
  if (!(isImage && isNeedUpdate)) return;

  // Genereate New
  const targetURL = generateURL({ hash, host, port, url, mime });
  console.log(`regenerating blurhash for image: ${targetURL}`);

  data.blurhash = await strapi
    .plugin(pluginName)
    .service('blurGenerator')
    .generateBlurhash(targetURL);
  console.log(`blurhash regenerated successfully: ${data.blurhash}`);
};

// Initial Creation
const createHandler = async (strapi: Core.Strapi, props: HandlerProps) => {
  const { data, host, port } = props;
  const { url, hash, mime } = data;
  const targetURL = generateURL({ hash, host, port, url, mime });
  console.log(`generating blurhash for image: ${targetURL}`);

  data.blurhash = await strapi
    .plugin(pluginName)
    .service('blurGenerator')
    .generateBlurhash(targetURL);
  console.log(`blurhash generated successfully: ${data.blurhash}`);
};

// Generate Handler
const blurhashHandler = async (strapi: Core.Strapi, event, cycleType: string) => {
  console.log(`generating blurhash for ${cycleType} event`);
  const { data, where } = event.params;

  const host = strapi.config.get('server.host', 'localhost');
  const port = strapi.config.get('server.port', 1337);
  console.log(`server config - host: ${host}, port: ${port}`);

  const isImage = data.mime && data.mime.startsWith('image/');
  if (isImage) await createHandler(strapi, { data, host, port });

  if (cycleType !== 'beforeUpdate') return;
  await beforeUpdateHandler(strapi, { data, where, host, port });
};

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.db.lifecycles.subscribe({
    models: ['plugin::upload.file'],
    beforeCreate: (event) => blurhashHandler(strapi, event, 'beforeCreate'),
    beforeUpdate: (event) => blurhashHandler(strapi, event, 'beforeUpdate'),
  });
  console.log('strapi-blurhash-plugin plugin bootstrap completed');
};

export default bootstrap;
