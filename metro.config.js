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

config.resolver.resolveRequest = (context, moduleName, platform) => {
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
