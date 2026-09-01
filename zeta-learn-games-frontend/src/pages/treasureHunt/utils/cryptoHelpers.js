const ASCII_ENCODER = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export const normalizeWhitespace = (value) => String(value).trim().replace(/\s+/g, " ");

export const normalizeAnswer = (value) => normalizeWhitespace(value).toLowerCase();

export const caesarEncrypt = (text, shift) => {
  const normalizedShift = ((shift % 26) + 26) % 26;

  return Array.from(text)
    .map((char) => {
      const code = char.charCodeAt(0);

      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
      }

      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
      }

      return char;
    })
    .join("");
};

export const caesarDecrypt = (text, shift) => caesarEncrypt(text, -shift);

export const progressiveShiftEncrypt = (text, pattern) => {
  return Array.from(text)
    .map((char, index) => {
      const step = pattern[index % pattern.length];
      return caesarEncrypt(char, step);
    })
    .join("");
};

export const progressiveShiftDecrypt = (text, pattern) => {
  return Array.from(text)
    .map((char, index) => {
      const step = pattern[index % pattern.length];
      return caesarDecrypt(char, step);
    })
    .join("");
};

export const textToBinary = (text) => {
  return Array.from(text)
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ");
};

export const binaryToText = (binaryText) => {
  return binaryText
    .trim()
    .split(/\s+/)
    .map((chunk) => String.fromCharCode(parseInt(chunk, 2)))
    .join("");
};

const encodeBase64Ascii = (value) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value);
  }

  let output = "";
  let i = 0;

  while (i < value.length) {
    const a = value.charCodeAt(i++) || 0;
    const b = value.charCodeAt(i++) || 0;
    const c = value.charCodeAt(i++) || 0;

    const triplet = (a << 16) | (b << 8) | c;

    output += ASCII_ENCODER[(triplet >> 18) & 0x3f];
    output += ASCII_ENCODER[(triplet >> 12) & 0x3f];
    output += i - 1 > value.length ? "=" : ASCII_ENCODER[(triplet >> 6) & 0x3f];
    output += i > value.length ? "=" : ASCII_ENCODER[triplet & 0x3f];
  }

  return output;
};

const decodeBase64Ascii = (value) => {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(value);
  }

  const clean = value.replace(/=+$/, "");
  let output = "";
  let bits = 0;
  let buffer = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const index = ASCII_ENCODER.indexOf(clean[i]);
    if (index < 0) {
      continue;
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};

export const toBase64 = (value) => encodeBase64Ascii(value);

export const fromBase64 = (value) => {
  try {
    return decodeBase64Ascii(value);
  } catch {
    return "";
  }
};

export const toBase64Url = (value) => {
  return toBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return fromBase64(padded);
};

export const xorEncodeHex = (value, key) => {
  return Array.from(value)
    .map((char) => (char.charCodeAt(0) ^ key).toString(16).padStart(2, "0"))
    .join("");
};

export const xorDecodeHex = (hexValue, key) => {
  const clean = hexValue.replace(/\s+/g, "");
  let output = "";

  for (let i = 0; i < clean.length; i += 2) {
    const chunk = clean.slice(i, i + 2);
    const code = parseInt(chunk, 16);

    if (Number.isNaN(code)) {
      return "";
    }

    output += String.fromCharCode(code ^ key);
  }

  return output;
};

export const isIPv4 = (value) => {
  const parts = String(value).trim().split(".");
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    const numeric = Number(part);
    return /^\d+$/.test(part) && numeric >= 0 && numeric <= 255;
  });
};
