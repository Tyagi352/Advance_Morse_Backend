const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SUPER_SECRET_JWT_KEY_CHANGE_ME";
const JWT_ALGORITHM = "HS256";
const JWT_EXP_DELTA_SECONDS = 3600 * 24; // 24 hours

function createJwtToken(username) {
  return jwt.sign({ username }, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXP_DELTA_SECONDS,
  });
}

function decodeJwtToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
  } catch {
    return null;
  }
}

module.exports = {
  createJwtToken,
  decodeJwtToken,
  JWT_SECRET
};
