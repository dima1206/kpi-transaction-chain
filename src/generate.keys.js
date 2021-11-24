// eslint-disable-next-line @typescript-eslint/no-var-requires
const jose = require('jose');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const rsaKey = jose.JWK.generateSync('RSA', 2048, { alg: 'RS256', use: 'sig' }, true);

const privateKey = rsaKey.toJWK(true);
const keyToSign = jose.JWK.asKey(privateKey);
const exp = new Date(10000000000000).getTime() / 1000;

const pubKeyClient1 = jose.JWS.sign({ client: 1, exp: exp }, keyToSign, { kid: privateKey.kid });
const pubKeyClient2 = jose.JWS.sign({ client: 2, exp: exp }, keyToSign, { kid: privateKey.kid });
const pubKeyClient3 = jose.JWS.sign({ client: 3, exp: exp }, keyToSign, { kid: privateKey.kid });
const pubKeyClient4 = jose.JWS.sign({ client: 3, exp: exp }, keyToSign, { kid: privateKey.kid });

const payload = {
  1: pubKeyClient1,
  2: pubKeyClient2,
  3: pubKeyClient3,
  4: pubKeyClient4.substr(10, 100) + 'unknown',
  privateKey,
};
fs.writeFileSync('keys.json', JSON.stringify(payload));
