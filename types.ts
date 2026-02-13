export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export enum Emotion {
  Neutral = 'neutral',
  Happy = 'cheerful',
  Sad = 'melancholic',
  Excited = 'excited',
  Professional = 'professional',
  Whisper = 'whispering',
  Angry = 'stern',
}

export interface AudioConfig {
  voice: VoiceName;
  emotion: Emotion;
  speed: number;
  pitch: number;
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
}
