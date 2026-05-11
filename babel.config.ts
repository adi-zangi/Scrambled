import type { ConfigAPI, TransformOptions } from '@babel/core';

export default (api: ConfigAPI): TransformOptions => {
  api.cache.forever();
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // must be last
  };
};