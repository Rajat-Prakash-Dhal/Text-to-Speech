/**
 * Decodes a base64 string into a Uint8Array.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (or other formats supported by decodeAudioData) into an AudioBuffer.
 * Note: standard decodeAudioData handles headers if present. 
 * If raw PCM is returned without headers, specific parsing might be needed, 
 * but Gemini API usually returns a format decodable by standard web APIs if headers are included,
 * OR raw PCM if using the Live API. 
 * 
 * For the REST API (generateContent), it typically returns MP3 or WAV-like container data 
 * which decodeAudioData handles natively.
 */
export async function decodeAudioData(
  audioData: Uint8Array,
  context: AudioContext
): Promise<AudioBuffer> {
  // We need to copy the buffer because decodeAudioData detaches it
  const bufferCopy = audioData.buffer.slice(0);
  return await context.decodeAudioData(bufferCopy);
}
