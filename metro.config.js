const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase uses .cjs files, we must tell Metro to accept them
config.resolver.sourceExts.push('cjs');

module.exports = config;