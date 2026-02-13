import React from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-16 w-full max-w-xs mx-auto overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-2 bg-indigo-500 rounded-full transition-all duration-300 ease-in-out ${
            isPlaying ? 'animate-pulse' : 'h-2 bg-indigo-900'
          }`}
          style={{
            height: isPlaying ? `${Math.random() * 100}%` : '4px',
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
            animationDelay: `${Math.random() * 0.2}s`
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
