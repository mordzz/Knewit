import fs from 'node:fs';

const env = {};
for (const rawLine of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const match = rawLine.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!match) continue;
  let value = match[2].trim();
  const c0 = value.charCodeAt(0), c1 = value.charCodeAt(value.length - 1);
  if ((c0 === 34 && c1 === 34) || (c0 === 39 && c1 === 39)) value = value.slice(1, -1);
  env[match[1]] = value;
}

const { PrivyClient } = await import('@privy-io/node');
const { signerFrom } = await import('@polymarket/client/privy');
const { builderApiKey } = await import('@polymarket/client/node');
const { createSecureClient } = await import('@polymarket/client');
const actions = await import('@polymarket/client/actions');
const bindings = await import('@polymarket/bindings');

console.log('bindings AssetType:', JSON.stringify(bindings.AssetType));

const privy = new PrivyClient({ appId: env.PRIVY_APP_ID, appSecret: env.PRIVY_APP_SECRET });
const wallet = ((await privy.wallets().list({ chain_type: 'ethereum' })).data ?? [])[0];
const signer = signerFrom({
  privy,
  walletId: wallet.id,
  authorizationContext: { authorization_private_keys: [env.PRIVY_AUTHORIZATION_PRIVATE_KEY] },
});
const client = await createSecureClient({
  signer,
  apiKey: builderApiKey({
    key: env.POLYMARKET_BUILDER_API_KEY,
    secret: env.POLYMARKET_BUILDER_SECRET,
    passphrase: env.POLYMARKET_BUILDER_PASSPHRASE,
  }),
});

const clobBindings = await import('@polymarket/bindings/clob');
const AssetType = clobBindings.AssetType;
const big = (v) => JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? x.toString() : x));
const balance = await actions.fetchBalanceAllowance(client, { assetType: AssetType.COLLATERAL });
console.log('fetchBalanceAllowance:', big(balance));

const estimate = await actions.estimateMarketPrice(client, { assetId: JSON.parse((await fetch('https://gamma-api.polymarket.com/markets/3398287').then((r) => r.json())).clobTokenIds)[0], amount: 10, side: bindings.OrderSide.BUY });
console.log('estimateMarketPrice:', big(estimate));

const approvals = await client.fetchTradingApprovalsState();
console.log('tradingApprovals:', big(approvals).slice(0, 400));
