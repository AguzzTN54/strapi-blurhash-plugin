import type { Core, Schema } from '@strapi/strapi';

interface FileAttr {
  attributes: { blurhash: { type: string } };
}

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const fileData = strapi.plugin('upload').contentTypes.file as unknown as Schema.ContentTypes &
    FileAttr;
  if (!fileData) return;
  fileData.attributes.blurhash = {
    type: 'text',
  };
};

export default register;
