// The package ships its declarations but its package.json doesn't point
// at them, so TypeScript can't find them on its own.
declare module 'react-native-qrcode-styled' {
  export { default } from 'react-native-qrcode-styled/lib/typescript/module/src/index';
  export * from 'react-native-qrcode-styled/lib/typescript/module/src/index';
}
