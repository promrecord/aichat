// Audio player utility supporting Gemini TTS (raw PCM / WAV) and Browser SpeechSynthesis fallback

let currentAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

export function stopCurrentAudio() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // ignore already stopped
    }
    currentSourceNode = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Decodes raw base64 PCM 24000Hz or standard audio formats into AudioBuffer
 */
function decodePCMToAudioBuffer(
  audioCtx: AudioContext,
  base64Data: string,
  sampleRate: number = 24000
): AudioBuffer {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini TTS returns 16-bit linear PCM (2 bytes per sample)
  const int16Array = new Int16Array(bytes.buffer);
  const audioBuffer = audioCtx.createBuffer(1, int16Array.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < int16Array.length; i++) {
    // Convert int16 [-32768, 32767] to float [-1.0, 1.0]
    channelData[i] = int16Array[i] / 32768.0;
  }

  return audioBuffer;
}

/**
 * Plays audio from Gemini TTS or falls back to Web Speech API
 */
export async function playCharacterVoice(options: {
  text: string;
  audioBase64?: string | null;
  mimeType?: string;
  characterId?: string;
  onStart?: () => void;
  onEnded?: () => void;
  onError?: (err: any) => void;
}): Promise<void> {
  const { text, audioBase64, characterId, onStart, onEnded, onError } = options;

  stopCurrentAudio();

  // Try playing Gemini TTS base64 audio if provided
  if (audioBase64 && audioBase64.length > 50) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error('AudioContext not supported');
      }

      if (!currentAudioContext || currentAudioContext.state === 'closed') {
        currentAudioContext = new AudioCtxClass();
      }

      if (currentAudioContext.state === 'suspended') {
        await currentAudioContext.resume();
      }

      const buffer = decodePCMToAudioBuffer(currentAudioContext, audioBase64, 24000);
      const source = currentAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(currentAudioContext.destination);

      currentSourceNode = source;

      source.onended = () => {
        currentSourceNode = null;
        onEnded?.();
      };

      onStart?.();
      source.start(0);
      return;
    } catch (err) {
      console.warn('PCM audio buffer decode/playback failed, falling back to Browser SpeechSynthesis:', err);
    }
  }

  // Fallback to Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const cleanText = text
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[*_~`]/g, '')
        .trim();

      if (!cleanText) {
        onEnded?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ko-KR';

      // Tune voice pitch and rate according to character identity
      if (characterId === 'sejong') {
        utterance.pitch = 0.85; // dignified, steady royal tone
        utterance.rate = 0.92;
      } else if (characterId === 'gwanggaeto') {
        utterance.pitch = 0.78; // deep, commanding heroic tone
        utterance.rate = 1.0;
      } else if (characterId === 'einstein') {
        utterance.pitch = 1.05; // playful, curious tone
        utterance.rate = 0.95;
      } else if (characterId === 'yisunsin') {
        utterance.pitch = 0.82; // solemn, martial fortitude
        utterance.rate = 0.9;
      } else if (characterId === 'cleopatra') {
        utterance.pitch = 1.1; // charismatic, elegant queen
        utterance.rate = 0.96;
      }

      // Try selecting a Korean voice if available
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang.startsWith('ko'));
      if (koVoice) {
        utterance.voice = koVoice;
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnded?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        onError?.(e);
        onEnded?.();
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch (speechErr) {
      console.error('Browser SpeechSynthesis also failed:', speechErr);
      onError?.(speechErr);
      onEnded?.();
    }
  }

  // If no speech is possible
  onEnded?.();
}
