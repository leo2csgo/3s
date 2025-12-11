import React from 'react';
import { MapPin, Calendar, Camera, Settings, ChevronRight, Award, Heart, Footprints } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      <div className="max-w-md mx-auto">
        {/* User Header */}
        <div className="glass-strong rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white text-2xl">🧳</span>
            </div>
            <div className="flex-1">
              <h2 className="text-white mb-1">旅行探索者</h2>
              <p className="text-white/60 text-sm">发现世界的美好</p>
            </div>
            <button className="glass rounded-full p-2 text-white/80 hover:text-white">
              <Settings size={20} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatItem icon={<MapPin size={20} />} label="足迹" value="12" />
            <StatItem icon={<Calendar size={20} />} label="行程" value="8" />
            <StatItem icon={<Camera size={20} />} label="POI" value="156" />
          </div>
        </div>

        {/* Achievements */}
        <div className="glass-strong rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-yellow-300" size={20} />
            <h3 className="text-white">成就徽章</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <AchievementBadge emoji="🌏" label="环球旅行者" unlocked />
            <AchievementBadge emoji="📸" label="摄影达人" unlocked />
            <AchievementBadge emoji="🗺️" label="路线规划师" unlocked />
            <AchievementBadge emoji="✈️" label="飞行常客" unlocked={false} />
            <AchievementBadge emoji="🏔️" label="登山爱好者" unlocked={false} />
            <AchievementBadge emoji="🏖️" label="海岛度假" unlocked />
            <AchievementBadge emoji="🍜" label="美食探索" unlocked />
            <AchievementBadge emoji="🎨" label="艺术鉴赏" unlocked={false} />
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <MenuItem
            icon={<Footprints size={20} />}
            label="我的足迹地图"
            onClick={() => {}}
          />
          <MenuItem
            icon={<Heart size={20} />}
            label="收藏的模板"
            badge="23"
            onClick={() => {}}
          />
          <MenuItem
            icon={<Camera size={20} />}
            label="旅行相册"
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-white/80">{icon}</div>
      <div className="text-white text-xl">{value}</div>
      <div className="text-white/60 text-xs">{label}</div>
    </div>
  );
}

interface AchievementBadgeProps {
  emoji: string;
  label: string;
  unlocked: boolean;
}

function AchievementBadge({ emoji, label, unlocked }: AchievementBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
        unlocked
          ? 'glass-strong'
          : 'glass opacity-50'
      }`}
    >
      <div className="text-2xl">{emoji}</div>
      <div className="text-white/80 text-xs text-center">{label}</div>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}

function MenuItem({ icon, label, badge, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full glass-strong rounded-xl p-4 flex items-center gap-3 text-white hover:scale-105 transition-transform active:scale-95"
    >
      <div className="text-white/80">{icon}</div>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="px-2 py-1 rounded-full bg-red-400 text-white text-xs">
          {badge}
        </span>
      )}
      <ChevronRight className="text-white/40" size={20} />
    </button>
  );
}
