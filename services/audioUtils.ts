// Utility to base64 decode
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Utility to decode PCM data into an AudioBuffer
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit PCM to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Simple audio player class to manage state
export class AudioPlayer {
  private context: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  async play(base64Audio: string, onEnded?: () => void) {
    // Stop any currently playing audio
    this.stop();

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    try {
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, this.context);
      
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);
      
      source.onended = () => {
        this.currentSource = null;
        if (onEnded) onEnded();
      };

      this.currentSource = source;
      source.start();
    } catch (error) {
      console.error("Audio playback error:", error);
      if (onEnded) onEnded();
    }
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
    }
  }
}
