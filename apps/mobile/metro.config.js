const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// A handful of Privy's own dependencies (jose, isows) ship a "node"
// package-exports condition that Metro picks by default and that pulls
// in real Node builtins (e.g. jose's runtime imports `buffer`), which
// don't exist in React Native. Forcing the "browser" condition only for
// these specific packages resolves them to their RN-safe build instead —
// confirmed necessary by an actual `expo export` failure, not applied
// speculatively. See docs/WALLET.md.
const nodeConditionPackages = ['jose', 'isows'];

// @noble/hashes@1.8.0's utils.js self-requires `@noble/hashes/crypto`;
// its package "exports" maps `./crypto` → `./crypto.js` but never lists
// `./crypto.js` itself, so Metro warns ("not listed in the exports …
// Falling back to file-based resolution") on every bundle. The fallback
// works — this is cosmetic — so we resolve that one subpath straight to
// the file and skip the exports check entirely. Remove once a version
// with `./crypto.js` in exports lands (1.8.0 is the last 1.x; 2.x
// renamed it to `webcrypto.js`).
const nobleCryptoFile = require('path').join(
  __dirname,
  'node_modules',
  '@noble',
  'hashes',
  'crypto.js'
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@noble/hashes/crypto' || moduleName === '@noble/hashes/crypto.js') {
    return { type: 'sourceFile', filePath: nobleCryptoFile };
  }
  if (nodeConditionPackages.some((pkg) => moduleName === pkg || moduleName.startsWith(`${pkg}/`))) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['browser'] },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
