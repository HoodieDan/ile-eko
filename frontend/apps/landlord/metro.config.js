// Learn more: https://docs.expo.dev/guides/monorepos/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch every package in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve modules from the app's node_modules first,
//    then fall back to the workspace root's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Avoid Metro following symlinks into duplicate copies of React etc.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
