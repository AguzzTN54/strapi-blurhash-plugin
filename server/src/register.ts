import type { Core, Schema } from '@strapi/strapi';

interface FileAttr extends Schema.ContentTypes {
  attributes: { blurhash: { type: string } };
}

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const fileData = strapi.plugin('upload').contentTypes.file as unknown as FileAttr;
  if (!fileData) return;
  fileData.attributes.blurhash = { type: 'text' };
};

export default register;
