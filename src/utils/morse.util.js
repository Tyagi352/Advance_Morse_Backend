const specialChars = {
  "1":"^~~~~", "2":"^^~~~", "3":"^^^~~", "4":"^^^^~", "5":"^^^^^",
  "6":"~^^^^", "7":"~~^^^", "8":"~~~^^", "9":"~~~~^", "0":"~~~~~",
  " ":".", ".":"^~^~^~", ",":"~~^^~~", "?":"^^~~^^", "'":"^~~~~^",
  "!":"~^~^~~", "/":"~^^~^", "(":"~^~~^", ")":"~^~~^~", "&":"^~^^^",
  ":":"~~~^^^", ";":"~^~^~^", "=":"~^^^~", "+":"^~^~^", "-":"~^^^^~",
  "_":"^^~~^~", '"':"^~^^~^", "$":"^^^~^^~", "@":"^~~^~^", "Á":"^~^~~",
  "Ä":"^~^~", "Å":"^~^~~", "Ñ":"~~^~~", "Ü":"^^~~"
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
    "É":"^^~^^", "È":"^~^^~", "À":"^~~^~", "Ç":"~^~^^", "Ù":"^^~~", "Ô":"~~~^",
    "Û":"^^~~", "Î":"^^~~^"
  },
  
  hindi: {
    ...englishBase,
    ...specialChars,
    // Devanagari standalone vowels (all unique 6-char codes)
    "अ":"~~~~~~", "आ":"~~~~~^", "इ":"~~~~^~", "ई":"~~~~^^",
    "उ":"~~~^~~", "ऊ":"~~~^~^", "ए":"~~~^^~", "ऐ":"~~^~~~",
    "ओ":"~~^~~^", "औ":"~~^~^~",
    // Devanagari consonants (all unique 6-char codes)
    "क":"~~^~^^", "ख":"~~^^~^", "ग":"~~^^^~", "घ":"~~^^^^",
    "च":"~^~~~~", "छ":"~^~~~^", "ज":"~^~~^^", "झ":"~^~^^~",
    "ञ":"~^~^^^", "ट":"~^^~~~", "ठ":"~^^~~^", "ड":"~^^~^~",
    "ढ":"~^^~^^", "ण":"~^^^~~", "त":"~^^^~^", "थ":"~^^^^^",
    "द":"^~~~~~", "ध":"^~~~^~", "न":"^~~~^^", "प":"^~~^~~",
    "फ":"^~~^^~", "ब":"^~~^^^", "भ":"^~^~~~", "म":"^~^~~^",
    "य":"^~^~^^", "र":"^~^^~~", "ल":"^~^^^~", "व":"^~^^^^",
    "श":"^^~~~~", "ष":"^^~~~^", "स":"^^~^~~", "ह":"^^~^~^",
    "ङ":"^^~^^~",
    // Devanagari matras (vowel signs)
    "ा":"^^~^^^", "ि":"^^^~~~", "ी":"^^^~~^", "ु":"^^^~^~",
    "ू":"^^^~^^", "ृ":"^^^^~~", "े":"^^^^~^", "ै":"^^^^^~",
    "ो":"^^^^^^", "ौ":"~^^^^^",
    // Devanagari combining marks (7-char codes to avoid collisions)
    "्":"~^^^^^^", "ं":"^~~~~~~", "ः":"^^~^^^^", "ँ":"~~~^^^^"
  },
  
  marathi: {
    // Marathi shares the same script as Hindi (Devanagari)
    // So it uses the same morse mappings as Hindi
    // Will be aliased below
  },
};

// Alias Marathi to Hindi since they use the same script
MORSE_CODES.marathi = MORSE_CODES.hindi;

// Function to validate if a character is supported in a language
function isCharacterSupported(char, language) {
  const map = MORSE_CODES[language] || MORSE_CODES.english;
  return char.toUpperCase() in map;
}

// Function to get all supported languages
function getSupportedLanguages() {
  return Object.keys(MORSE_CODES);
}

// Improved encode function with better validation
function encodeToMorse(text, language = "english") {
  if (!text || !text.trim()) {
    return "";
  }
  
  const lang = language.toLowerCase();
  if (!MORSE_CODES[lang]) {
    throw new Error(`Unsupported language: ${language}. Supported: ${getSupportedLanguages().join(", ")}`);
  }

  const map = MORSE_CODES[lang];
  const upper = text.toUpperCase();
  const encoded = [];
  
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (map[ch] !== undefined) {
      encoded.push(map[ch]);
    } else {
      // Skip unsupported characters
      console.warn(`Character "${ch}" not supported in ${language}`);
    }
  }
  
  return encoded.join(" ");
}

// Improved decode function with better error handling
function decodeFromMorse(morseCode, language = "english") {
  if (!morseCode || !morseCode.trim()) {
    return "";
  }
  
  const lang = language.toLowerCase();
  if (!MORSE_CODES[lang]) {
    throw new Error(`Unsupported language: ${language}. Supported: ${getSupportedLanguages().join(", ")}`);
  }

  const map = MORSE_CODES[lang];
  const reverse = Object.fromEntries(
    Object.entries(map).map(([k, v]) => [v, k])
  );
  
  return morseCode
    .split(" ")
    .map((code) => reverse[code] || "")
    .filter(Boolean)
    .join("");
}

module.exports = {
  encodeToMorse,
  decodeFromMorse,
  isCharacterSupported,
  getSupportedLanguages,
  MORSE_CODES
};

