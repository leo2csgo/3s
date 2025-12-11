import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface AIGenerateModalProps {
  onClose: () => void;
  onComplete: (tripId: string) => void;
}

const cities = ['巴黎', '东京', '纽约', '巴厘岛', '伦敦', '罗马', '首尔', '曼谷'];
const preferences = [
  { id: 'couple', label: '情侣', emoji: '💑' },
  { id: 'family', label: '亲子', emoji: '👨‍👩‍👧' },
  { id: 'food', label: '美食', emoji: '🍜' },
  { id: 'photo', label: '摄影', emoji: '📸' },
  { id: 'shopping', label: '购物', emoji: '🛍️' },
  { id: 'culture', label: '文化', emoji: '🎭' }
];

export default function AIGenerateModal({ onClose, onComplete }: AIGenerateModalProps) {
  const [step, setStep] = useState<'input' | 'generating' | 'success'>('input');
  const [selectedCity, setSelectedCity] = useState('');
  const [days, setDays] = useState('5');
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const handleGenerate = () => {
    if (!selectedCity || !days) return;

    setStep('generating');

    // Simulate AI generation
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onComplete('ai-generated-trip');
      }, 1000);
    }, 3000);
  };

  const togglePreference = (id: string) => {
    setSelectedPrefs(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
        {step === 'input' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="text-yellow-300" size={24} />
                <h2 className="text-white">AI 魔法生成</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* City Selection */}
            <div className="mb-6">
              <label className="text-white mb-3 block">目的地</label>
              <div className="grid grid-cols-4 gap-2">
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`py-2 px-3 rounded-xl text-sm transition-all ${
                      selectedCity === city
                        ? 'glass-strong text-white scale-105'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Days Input */}
            <div className="mb-6">
              <label className="text-white mb-3 block">游玩天数</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDays(Math.max(1, parseInt(days) - 1).toString())}
                  className="glass-strong rounded-xl p-3 text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="flex-1 glass-strong rounded-xl p-3 text-white text-center bg-transparent border-none outline-none"
                />
                <button
                  onClick={() => setDays((parseInt(days) + 1).toString())}
                  className="glass-strong rounded-xl p-3 text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Preferences */}
            <div className="mb-6">
              <label className="text-white mb-3 block">旅行偏好（可多选）</label>
              <div className="grid grid-cols-3 gap-2">
                {preferences.map(pref => (
                  <button
                    key={pref.id}
                    onClick={() => togglePreference(pref.id)}
                    className={`py-3 rounded-xl text-sm transition-all ${
                      selectedPrefs.includes(pref.id)
                        ? 'glass-strong text-white scale-105'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{pref.emoji}</div>
                    <div>{pref.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedCity || !days}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                selectedCity && days
                  ? 'bg-white text-purple-600 hover:scale-105'
                  : 'glass text-white/40 cursor-not-allowed'
              }`}
            >
              <Sparkles size={20} />
              <span>开始生成</span>
            </button>
          </>
        )}

        {step === 'generating' && (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-white mx-auto mb-4 animate-spin" />
            <h3 className="text-white mb-2">AI 正在为你规划行程...</h3>
            <p className="text-white/60 text-sm">
              根据你的偏好生成最佳路线
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-white mb-2">生成完成！</h3>
            <p className="text-white/60 text-sm">即将为你展示行程</p>
          </div>
        )}
      </div>
    </div>
  );
}
