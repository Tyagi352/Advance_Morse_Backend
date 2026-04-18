const specialChars = {
  "1":"^~~~~", "2":"^^~~~", "3":"^^^~~", "4":"^^^^~", "5":"^^^^^",
  "6":"~^^^^", "7":"~~^^^", "8":"~~~^^", "9":"~~~~^", "0":"~~~~~",
  " ":".", ".":"^~^~^~", ",":"~~^^~~", "?":"^^~~^^", "'":"^~~~~^",
  "!":"~^~^~~", "/":"~^^~^", "(":"~^~~^", ")":"~^~~^~", "&":"^~^^^",
  ":":"~~~^^^", ";":"~^~^~^", "=":"~^^^~", "+":"^~^~^", "-":"~^^^^~",
  "_":"^^~~^~", '"':"^~^^~^", "$":"^^^~^^~", "@":"^~~^~^"
};

const englishBase = {
  A:"^~", B:"~^^^", C:"~^~^", D:"~^^", E:"^", F:"^^~^", G:"~~^", H:"^^^^",
  I:"^^", J:"^~~~", K:"~^~", L:"^~^^", M:"~~", N:"~^", O:"~~~", P:"^~~^",
  Q:"~~^~", R:"^~^", S:"^^^", T:"~", U:"^^~", V:"^^^~", W:"^~~", X:"~^^~",
  Y:"~^~~", Z:"~~^^"
};

const MORSE_CODES = {
  english: { ...englishBase, ...specialChars },
  french: {
    ...englishBase,
    ...specialChars,
    "É":"^^~^^", "È":"^~^^~", "À":"^~~^~", "Ç":"~^~^^", "Ù":"^^~~", "Ô":"~~~^"
  },
  hindi: {
    ...englishBase,
    ...specialChars,
    "अ":"^~", "आ":"^~^~", "इ":"^^", "ई":"^^~", "उ":"^^^~", "ऊ":"^^~~", "ए":"^", "ऐ":"^^~^^", "ओ":"~~~", "औ":"~~~^",
    "क":"~^~", "ख":"~^~^", "ग":"~~^", "घ":"~~^~", "च":"~^~^^", "छ":"~^~~", "ज":"^~~~", "झ":"^~~~^", "ट":"~", 
    "ठ":"~^^~", "ड":"~^^", "ढ":"~^^~^", "त":"~", "थ":"~^^~", "द":"~^^", "ध":"~^^~^", "न":"~^", "प":"^~~^", 
    "फ":"^^~^", "ब":"~^^^", "भ":"~^^^~", "म":"~~", "य":"~^~~", "र":"^~^", "ल":"^~^^", "व":"^~~", "श":"^~^~^", 
    "ष":"^^~~^", "स":"^^^", "ह":"^^^^"
  }
};
MORSE_CODES.marathi = MORSE_CODES.hindi;

function encodeToMorse(text, language) {
  const map = MORSE_CODES[language] || MORSE_CODES.english;
  const upper = text.toUpperCase();
  return Array.from(upper)
    .map((ch) => map[ch] || "")
    .filter(Boolean)
    .join(" ");
}

function decodeFromMorse(morseCode, language) {
  const map     = MORSE_CODES[language] || MORSE_CODES.english;
  const reverse = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
  return morseCode
    .split(" ")
    .map((code) => reverse[code] || "")
    .join("");
}

module.exports = {
  encodeToMorse,
  decodeFromMorse
};
