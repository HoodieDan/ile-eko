// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');

// getDefaultConfig (SDK 54+) auto-detects the pnpm workspace root and configures
// watchFolders + resolver.nodeModulesPaths for the monorepo. No manual overrides
// are needed — overriding them only narrows the defaults and breaks resolution.
const config = getDefaultConfig(__dirname);

module.exports = config;
