import React, { useState } from 'react';
import { X, MapPin, Navigation as NavigationIcon, FileText } from 'lucide-react';

interface AddBlockDrawerProps {
  onClose: () => void;
  onAdd: (blockType: 'poi' | 'transport' | 'text', blockData: any) => void;
}

type BlockType = 'poi' | 'transport' | 'text';

export default function AddBlockDrawer({ onClose, onAdd }: AddBlockDrawerProps) {
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleTypeSelect = (type: BlockType) => {
    setSelectedType(type);
    setFormData({});
  };

  const handleSubmit = () => {
    if (!selectedType) return;

    let blockData: any = {};

    if (selectedType === 'poi') {
      blockData = {
        name: formData.name || '新地点',
        time: formData.time || '10:00',
        duration: formData.duration || '1小时',
        note: formData.note || ''
      };
    } else if (selectedType === 'transport') {
      blockData = {
        method: formData.method || '步行',
        from: formData.from || '起点',
        to: formData.to || '终点',
        duration: formData.duration || '10分钟'
      };
    } else if (selectedType === 'text') {
      blockData = {
        content: formData.content || '新笔记'
      };
    }

    onAdd(selectedType, blockData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white">添加内容</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {!selectedType ? (
          /* Type Selection */
          <div className="space-y-3">
            <TypeOption
              icon={<MapPin size={24} />}
              title="地点 POI"
              description="景点、餐厅、酒店等"
              onClick={() => handleTypeSelect('poi')}
            />
            <TypeOption
              icon={<NavigationIcon size={24} />}
              title="交通方式"
              description="地铁、出租车、步行等"
              onClick={() => handleTypeSelect('transport')}
            />
            <TypeOption
              icon={<FileText size={24} />}
              title="文字备注"
              description="旅行贴士、注意事项等"
              onClick={() => handleTypeSelect('text')}
            />
          </div>
        ) : (
          /* Form */
          <div>
            <button
              onClick={() => setSelectedType(null)}
              className="text-white/60 hover:text-white text-sm mb-4"
            >
              ← 返回选择
            </button>

            {selectedType === 'poi' && (
              <div className="space-y-4">
                <FormField
                  label="地点名称"
                  value={formData.name || ''}
                  onChange={(value) => setFormData({ ...formData, name: value })}
                  placeholder="例如：埃菲尔铁塔"
                />
                <FormField
                  label="到达时间"
                  value={formData.time || ''}
                  onChange={(value) => setFormData({ ...formData, time: value })}
                  placeholder="例如：10:00"
                />
                <FormField
                  label="停留时长"
                  value={formData.duration || ''}
                  onChange={(value) => setFormData({ ...formData, duration: value })}
                  placeholder="例如：2小时"
                />
                <FormField
                  label="备注"
                  value={formData.note || ''}
                  onChange={(value) => setFormData({ ...formData, note: value })}
                  placeholder="例如：提前预订门票"
                  multiline
                />
              </div>
            )}

            {selectedType === 'transport' && (
              <div className="space-y-4">
                <FormField
                  label="交通方式"
                  value={formData.method || ''}
                  onChange={(value) => setFormData({ ...formData, method: value })}
                  placeholder="例如：地铁"
                />
                <FormField
                  label="起点"
                  value={formData.from || ''}
                  onChange={(value) => setFormData({ ...formData, from: value })}
                  placeholder="例如：埃菲尔铁塔"
                />
                <FormField
                  label="终点"
                  value={formData.to || ''}
                  onChange={(value) => setFormData({ ...formData, to: value })}
                  placeholder="例如：卢浮宫"
                />
                <FormField
                  label="用时"
                  value={formData.duration || ''}
                  onChange={(value) => setFormData({ ...formData, duration: value })}
                  placeholder="例如：30分钟"
                />
              </div>
            )}

            {selectedType === 'text' && (
              <div className="space-y-4">
                <FormField
                  label="备注内容"
                  value={formData.content || ''}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="输入你的旅行贴士..."
                  multiline
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full mt-6 py-3 rounded-xl bg-white text-purple-600 hover:scale-105 transition-transform"
            >
              添加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface TypeOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function TypeOption({ icon, title, description, onClick }: TypeOptionProps) {
  return (
    <button
      onClick={onClick}
      className="w-full glass-strong rounded-xl p-4 flex items-center gap-4 text-left hover:scale-105 transition-transform active:scale-95"
    >
      <div className="text-white/80">{icon}</div>
      <div className="flex-1">
        <h3 className="text-white mb-1">{title}</h3>
        <p className="text-white/60 text-sm">{description}</p>
      </div>
    </button>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

function FormField({ label, value, onChange, placeholder, multiline }: FormFieldProps) {
  return (
    <div>
      <label className="text-white text-sm mb-2 block">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full glass-strong rounded-xl p-3 text-white bg-transparent border-none outline-none resize-none"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full glass-strong rounded-xl p-3 text-white bg-transparent border-none outline-none"
        />
      )}
    </div>
  );
}
