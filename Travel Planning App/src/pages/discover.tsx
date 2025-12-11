import React, { useState } from 'react';
import { Sparkles, Plus, TrendingUp, Heart } from 'lucide-react';
import AIGenerateModal from '../components/ai-generate-modal';

interface DiscoverPageProps {
  onNavigateToDetail: (tripId: string) => void;
}

const templateTrips = [
  {
    id: '1',
    title: '巴黎浪漫5日游',
    image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc2NTQyMjE0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    days: 5,
    likes: 1234,
    tags: ['情侣', '浪漫', '艺术']
  },
  {
    id: '2',
    title: '东京深度7日游',
    image: 'https://images.unsplash.com/photo-1663511172227-ab917d4bb4b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMHN0cmVldCUyMG5pZ2h0fGVufDF8fHx8MTc2NTM2NjE3Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    days: 7,
    likes: 2156,
    tags: ['美食', '购物', '文化']
  },
  {
    id: '3',
    title: '巴厘岛度假6日',
    image: 'https://images.unsplash.com/photo-1717501787981-d5f28eb2df5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwYmVhY2glMjBzdW5zZXR8ZW58MXx8fHwxNzY1MzQ2NDk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    days: 6,
    likes: 3421,
    tags: ['海岛', '度假', '亲子']
  },
  {
    id: '4',
    title: '纽约都市4日探索',
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwY2l0eSUyMHNreWxpbmV8ZW58MXx8fHwxNzY1NDM1NDg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    days: 4,
    likes: 1876,
    tags: ['都市', '摄影', '购物']
  }
];

export default function DiscoverPage({ onNavigateToDetail }: DiscoverPageProps) {
  const [showAIModal, setShowAIModal] = useState(false);

  const handleCreateBlank = () => {
    // Create blank trip and navigate
    onNavigateToDetail('new-blank');
  };

  const handleAIGenerate = () => {
    setShowAIModal(true);
  };

  const handleAIComplete = (tripId: string) => {
    setShowAIModal(false);
    onNavigateToDetail(tripId);
  };

  const handleCloneTemplate = (templateId: string) => {
    onNavigateToDetail(`clone-${templateId}`);
  };

  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white mb-2">发现灵感</h1>
          <p className="text-white/70">开启你的下一段旅程</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          {/* AI Magic Button */}
          <button
            onClick={handleAIGenerate}
            className="flex-1 glass-strong rounded-2xl p-4 flex items-center justify-center gap-2 text-white hover:scale-105 transition-transform active:scale-95"
          >
            <Sparkles className="text-yellow-300" size={20} />
            <span>AI 魔法生成</span>
          </button>

          {/* Blank Create Button */}
          <button
            onClick={handleCreateBlank}
            className="glass-strong rounded-2xl p-4 flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Templates Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-white/80" size={20} />
            <h2 className="text-white">热门模板</h2>
          </div>

          {/* Masonry Grid */}
          <div className="grid grid-cols-2 gap-3">
            {templateTrips.map((trip, index) => (
              <div
                key={trip.id}
                className={index % 3 === 0 ? 'col-span-2' : ''}
              >
                <TemplateCard
                  trip={trip}
                  onClone={() => handleCloneTemplate(trip.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAIModal && (
        <AIGenerateModal
          onClose={() => setShowAIModal(false)}
          onComplete={handleAIComplete}
        />
      )}
    </div>
  );
}

interface TemplateCardProps {
  trip: typeof templateTrips[0];
  onClone: () => void;
}

function TemplateCard({ trip, onClone }: TemplateCardProps) {
  return (
    <div
      onClick={onClone}
      className="glass rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform active:scale-95"
    >
      <div className="relative aspect-video">
        <img
          src={trip.image}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 glass-strong rounded-full px-3 py-1 text-white text-xs">
          {trip.days}天
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-white mb-2">{trip.title}</h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {trip.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-white/60 text-sm">
          <Heart size={14} />
          <span>{trip.likes}</span>
        </div>
      </div>
    </div>
  );
}
