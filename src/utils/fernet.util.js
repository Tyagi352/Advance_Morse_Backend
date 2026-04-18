const crypto = require("crypto");
const fernet = require("fernet");

function generateFernetKey() {
  const rand = crypto.randomBytes(32);
  let base64 = rand.toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_"); // URL-safe
}

function fernetEncrypt(keyStr, plaintext) {
  const secret = new fernet.Secret(keyStr);
  const token  = new fernet.Token({ secret, ttl: 0 });
  return token.encode(plaintext);
}

function fernetDecrypt(keyStr, ciphertext) {
  const secret = new fernet.Secret(keyStr);
  const token  = new fernet.Token({
    secret,
    token: ciphertext,
    ttl: 0,
  });
  return token.decode();
}

module.exports = {
  generateFernetKey,
  fernetEncrypt,
  fernetDecrypt
};
