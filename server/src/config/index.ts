import type { Config } from '../types';

export default {
  default: {
    regenerateOnUpdate: false,
    forceRegenerateOnUpdate: false,
    flatten: false,
    flattenColor: null,
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
        if (!('r' in bg && 'g' in bg && 'b' in bg)) {
          throw new Error("flattenColor should has 'r', 'g', & 'b' attributes");
        }
        if (typeof bg.r !== 'number' || typeof bg.g !== 'number' || typeof bg.b !== 'number') {
          throw new Error('flattenColor attributes should be number');
        }

        if (
          bg.r > 255 ||
          bg.g > 255 ||
          bg.b > 255 ||
          bg.r < 0 ||
          bg.g < 0 ||
          bg.b < 0 ||
          !Number.isInteger(bg.r) ||
          !Number.isInteger(bg.g) ||
          !Number.isInteger(bg.b)
        ) {
          throw new Error('flattenColor attributes should be integer between 0 - 255');
        }
      }

      if (!((typeof bg).match(/(string|object|undefined)/) || bg === null)) {
        throw new Error('flattenColor not a valid HEX or RGB Format');
      }
    }
  },
};
