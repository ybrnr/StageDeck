const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const LOOKUP = (() => {
  const table = new Uint8Array(128).fill(255);
  for (let i = 0; i < BASE64_ALPHABET.length; i++) {
    table[BASE64_ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

/**
 * Decodes a base64 string into bytes. Tolerates whitespace and missing
 * padding; throws on any other non-alphabet character.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const unpadded = base64.replace(/\s+/g, "").replace(/=+$/, "");
  const bytes = new Uint8Array(Math.floor((unpadded.length * 3) / 4));

  let buffer = 0;
  let bitsCollected = 0;
  let outIndex = 0;

  for (let i = 0; i < unpadded.length; i++) {
    const code = unpadded.charCodeAt(i);
    const value = code < 128 ? LOOKUP[code] : 255;
    if (value === 255) {
      throw new Error(`Invalid base64 character at index ${i}`);
    }
    buffer = (buffer << 6) | value;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes[outIndex++] = (buffer >> bitsCollected) & 0xff;
    }
  }

  return bytes;
}
