import type { Config } from '../types';

export const PLUGIN_NAME = 'blurhash';
export const SUPPORTED_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/avif',
  'image/webp',
  'image/svg',
  'image/gif',
];

export default {
  default: {
    regenerateOnUpdate: false,
    forceRegenerateOnUpdate: false,
    flatten: false,
    flattenColor: 'white',
  },
  validator: (config: Config) => {
    const { flatten, flattenColor: bg, forceRegenerateOnUpdate, regenerateOnUpdate } = config || {};
    if (typeof regenerateOnUpdate !== 'boolean') {
      throw new Error('regenerateOnUpdate has to be a boolean');
    }
    if (typeof forceRegenerateOnUpdate !== 'boolean') {
      throw new Error('forceRegenerateOnUpdate has to be a boolean');
    }
    if (typeof flatten !== 'boolean') {
      throw new Error('flatten has to be a boolean');
    }

    if (flatten && bg) {
      if (typeof bg === 'object') {
        const bgValTypes = [];
        Object.keys(bg).forEach((k) => bgValTypes.push(typeof bg[k] === 'number'));
        if (bgValTypes.includes(false)) {
          throw new Error('flattenColor attributes should be number');
        }
      }

      if (!((typeof bg).match(/(string|object|undefined)/) || bg === null)) {
        throw new Error('flattenColor not a valid Color Format');
      }
    }
  },
};
