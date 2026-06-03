module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54+) automatically adds the
    // react-native-worklets/plugin needed by Reanimated 4.
    presets: ['babel-preset-expo'],
  };
};
