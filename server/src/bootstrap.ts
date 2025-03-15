import { Core } from '@strapi/strapi';
import { SUPPORTED_MIMES } from './config';
import middlewares from './middlewares';

// Assign Blurhash from Middelware to the record
const blurhashHandler = async (strapi: Core.Strapi, event) => {
  const { blurhash } = strapi.requestContext.get().state; // value from middleware
  const { data } = event.params;
  const isSupported = data.mime && SUPPORTED_MIMES.includes(data.mime);
  if (!isSupported && blurhash) return;
  data.blurhash = blurhash;
};

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.db.lifecycles.subscribe({
    models: ['plugin::upload.file'],
    beforeCreate: (event) => blurhashHandler(strapi, event),
    beforeUpdate: (event) => blurhashHandler(strapi, event),
  });

  strapi.server.use(middlewares.blurhashProcessor(strapi));
};

export default bootstrap;
