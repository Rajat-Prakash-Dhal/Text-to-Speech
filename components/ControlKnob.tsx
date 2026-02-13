import React from 'react';

interface ControlKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
  icon?: React.ReactNode;
}

const ControlKnob: React.FC<ControlKnobProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (v) => v.toString(),
  icon,
}) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-800 rounded-xl border border-slate-700/50">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          {icon}
          {label}
        </div>
        <span className="text-indigo-400 text-xs font-mono bg-indigo-400/10 px-2 py-0.5 rounded">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
      />
    </div>
  );
};

export default ControlKnob;
