export interface Config {
  regenerateOnUpdate: boolean;
  forceRegenerateOnUpdate: boolean;
}

export default {
  default: {
    regenerateOnUpdate: false,
    forceRegenerateOnUpdate: false,
  },
  validator: (config: Config) => {
    if (typeof config.regenerateOnUpdate !== 'boolean') {
      throw new Error('regenerateOnUpdate has to be a boolean');
    }
    if (typeof config.forceRegenerateOnUpdate !== 'boolean') {
      throw new Error('forceRegenerateOnUpdate has to be a boolean');
    }
  },
};
