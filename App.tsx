import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Wand2, 
  Settings2, 
  Mic2, 
  Gauge, 
  Activity,
  Download,
  Volume2
} from 'lucide-react';
import { VoiceName, Emotion, AudioConfig } from './types';
import { generateSpeech } from './services/geminiService';
import { decodeBase64, decodeAudioData } from './utils/audioUtils';
import AudioVisualizer from './components/AudioVisualizer';
import ControlKnob from './components/ControlKnob';

const App: React.FC = () => {
  // State
  const [text, setText] = useState<string>('Hello! I can speak with different emotions and voices. Try changing the settings below.');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AudioConfig>({
    voice: VoiceName.Kore,
    emotion: Emotion.Neutral,
    speed: 1.0,
    pitch: 0, // In cents, 0 is normal
  });

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize Audio Context
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
    };
    initAudio();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(async (buffer: AudioBuffer) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    stopAudio();

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    
    // Apply speed and pitch
    source.playbackRate.value = config.speed;
    source.detune.value = config.pitch;

    source.connect(gainNodeRef.current);
    
    source.onended = () => {
      setIsPlaying(false);
    };

    sourceNodeRef.current = source;
    source.start(0);
    startTimeRef.current = audioContextRef.current.currentTime;
    setIsPlaying(true);
  }, [config.speed, config.pitch, stopAudio]);

  const handleGenerateAndPlay = async () => {
    if (!text.trim()) return;
    setError(null);
    setIsLoading(true);
    stopAudio();

    try {
      const base64Audio = await generateSpeech(text, config.voice, config.emotion);
      const audioBytes = decodeBase64(base64Audio);
      
      if (!audioContextRef.current) throw new Error("Audio Context not initialized");
      
      const buffer = await decodeAudioData(audioBytes, audioContextRef.current);
      audioBufferRef.current = buffer;
      playAudio(buffer);

    } catch (err: any) {
      setError(err.message || "Failed to generate speech");
    } finally {
      setIsLoading(false);
    }
  };

  // Update live controls if playing
  useEffect(() => {
    if (sourceNodeRef.current && isPlaying) {
      // Real-time updates for speed and pitch
      sourceNodeRef.current.playbackRate.setValueAtTime(config.speed, audioContextRef.current!.currentTime);
      sourceNodeRef.current.detune.setValueAtTime(config.pitch, audioContextRef.current!.currentTime);
    }
  }, [config.speed, config.pitch, isPlaying]);

  const handleReplay = () => {
    if (audioBufferRef.current) {
      playAudio(audioBufferRef.current);
    } else {
      handleGenerateAndPlay();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
              <Settings2 className="w-5 h-5" />
              Configuration
            </h2>
            
            <div className="space-y-6">
              {/* Voice Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Mic2 className="w-4 h-4" /> Voice
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(VoiceName).map((voice) => (
                    <button
                      key={voice}
                      onClick={() => setConfig({ ...config, voice })}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        config.voice === voice
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {voice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotion Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" /> Emotion / Tone
                </label>
                <select
                  value={config.emotion}
                  onChange={(e) => setConfig({ ...config, emotion: e.target.value as Emotion })}
                  className="w-full bg-slate-700/50 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2.5 outline-none"
                >
                  {Object.values(Emotion).map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sliders */}
              <ControlKnob
                label="Speed"
                icon={<Gauge className="w-4 h-4" />}
                value={config.speed}
                min={0.5}
                max={2.0}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}x`}
                onChange={(val) => setConfig({ ...config, speed: val })}
              />

              <ControlKnob
                label="Pitch"
                icon={<Activity className="w-4 h-4" />}
                value={config.pitch}
                min={-1200}
                max={1200}
                step={100}
                formatValue={(v) => `${v > 0 ? '+' : ''}${v}`}
                onChange={(val) => setConfig({ ...config, pitch: val })}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Input & Preview */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl flex flex-col flex-grow min-h-[500px]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">VoxGen AI</h1>
                  <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
              <div className="flex gap-2">
                 {/* Placeholder for future features like download */}
              </div>
            </div>

            {/* Text Input Area */}
            <div className="flex-grow p-6 flex flex-col">
              <label className="text-sm font-medium text-slate-300 mb-2">Input Text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type something here to convert to speech..."
                className="flex-grow w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all text-lg leading-relaxed"
                maxLength={5000}
              />
              <div className="flex justify-end mt-2 text-xs text-slate-500">
                {text.length} / 5000 characters
              </div>
            </div>

            {/* Visualization & Actions */}
            <div className="p-6 bg-slate-900/30 border-t border-slate-700 rounded-b-2xl">
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex-1 w-full md:w-auto">
                   <AudioVisualizer isPlaying={isPlaying} />
                   <div className="text-center mt-2 text-xs text-slate-500 font-mono">
                     {isPlaying ? 'PLAYING AUDIO...' : 'READY TO GENERATE'}
                   </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {isPlaying ? (
                    <button
                      onClick={stopAudio}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25 transition-all transform hover:scale-105"
                    >
                      <Square className="w-5 h-5 fill-current" /> Stop
                    </button>
                  ) : (
                    <>
                      {audioBufferRef.current && (
                         <button
                         onClick={handleReplay}
                         className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
                       >
                         <Play className="w-5 h-5" /> Replay
                       </button>
                      )}
                      <button
                        onClick={handleGenerateAndPlay}
                        disabled={isLoading || !text.trim()}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 ${
                          isLoading || !text.trim()
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            Generate Speech
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
