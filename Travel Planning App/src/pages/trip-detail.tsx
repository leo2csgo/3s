import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Edit3, 
  MapIcon, 
  Share2, 
  Plus,
  Navigation,
  Clock,
  DollarSign,
  Calendar
} from 'lucide-react';
import AddBlockDrawer from '../components/add-block-drawer';

interface TripDetailPageProps {
  tripId: string;
  onBack: () => void;
}

type BlockType = 'poi' | 'transport' | 'text' | 'day-divider';

interface Block {
  id: string;
  type: BlockType;
  data: any;
}

interface Day {
  date: string;
  blocks: Block[];
}

export default function TripDetailPage({ tripId, onBack }: TripDetailPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedInsertIndex, setSelectedInsertIndex] = useState<{ dayIndex: number; blockIndex: number } | null>(null);

  // Mock data
  const [tripData] = useState({
    title: '巴黎浪漫之旅',
    destination: '法国·巴黎',
    days: 5,
    budget: '¥15,000',
    startDate: '2025-03-15',
    coverImage: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc2NTQyMjE0MHww&ixlib=rb-4.1.0&q=80&w=1080'
  });

  const [itinerary, setItinerary] = useState<Day[]>([
    {
      date: '2025-03-15',
      blocks: [
        {
          id: '1',
          type: 'poi',
          data: { name: '埃菲尔铁塔', time: '10:00', duration: '2小时', note: '提前预订门票' }
        },
        {
          id: '2',
          type: 'transport',
          data: { method: '地铁', from: '埃菲尔铁塔', to: '卢浮宫', duration: '30分钟' }
        },
        {
          id: '3',
          type: 'poi',
          data: { name: '卢浮宫', time: '14:00', duration: '3小时', note: '必看蒙娜丽莎' }
        },
        {
          id: '4',
          type: 'text',
          data: { content: '💡 记得带相机和充电宝' }
        }
      ]
    },
    {
      date: '2025-03-16',
      blocks: [
        {
          id: '5',
          type: 'poi',
          data: { name: '凯旋门', time: '09:00', duration: '1.5小时' }
        },
        {
          id: '6',
          type: 'poi',
          data: { name: '香榭丽舍大街', time: '11:00', duration: '2小时', note: '购物天堂' }
        }
      ]
    }
  ]);

  const handleAddBlock = (dayIndex: number, blockIndex: number) => {
    setSelectedInsertIndex({ dayIndex, blockIndex });
    setShowAddDrawer(true);
  };

  const handleBlockAdded = (blockType: BlockType, blockData: any) => {
    if (!selectedInsertIndex) return;

    const newBlock: Block = {
      id: Date.now().toString(),
      type: blockType,
      data: blockData
    };

    setItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[selectedInsertIndex.dayIndex].blocks.splice(
        selectedInsertIndex.blockIndex,
        0,
        newBlock
      );
      return newItinerary;
    });

    setShowAddDrawer(false);
    setSelectedInsertIndex(null);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-64">
        <img
          src={tripData.coverImage}
          alt={tripData.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="glass-strong rounded-full p-2 text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button className="glass-strong rounded-full p-2 text-white">
            <Share2 size={20} />
          </button>
        </div>

        {/* Trip Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white mb-2">{tripData.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge icon={<MapIcon size={14} />} text={tripData.destination} />
            <Badge icon={<Calendar size={14} />} text={`${tripData.days}天`} />
            <Badge icon={<DollarSign size={14} />} text={tripData.budget} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {itinerary.map((day, dayIndex) => (
            <div key={day.date} className="mb-8">
              {/* Day Header */}
              <div className="glass-strong rounded-xl p-3 mb-4 flex items-center gap-2">
                <Calendar className="text-white/80" size={20} />
                <span className="text-white">Day {dayIndex + 1}</span>
                <span className="text-white/60 text-sm ml-auto">{day.date}</span>
              </div>

              {/* Timeline Line */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/20" />

                {/* Blocks */}
                <div className="space-y-4">
                  {/* Add button at start */}
                  {isEditing && (
                    <InsertButton onClick={() => handleAddBlock(dayIndex, 0)} />
                  )}

                  {day.blocks.map((block, blockIndex) => (
                    <React.Fragment key={block.id}>
                      <BlockItem block={block} />
                      {isEditing && (
                        <InsertButton onClick={() => handleAddBlock(dayIndex, blockIndex + 1)} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex-1 rounded-xl py-3 flex items-center justify-center gap-2 transition-all ${
              isEditing
                ? 'bg-white text-purple-600'
                : 'glass text-white'
            }`}
          >
            <Edit3 size={20} />
            <span>{isEditing ? '完成编辑' : '编辑行程'}</span>
          </button>
          <button className="glass rounded-xl p-3 text-white">
            <MapIcon size={24} />
          </button>
        </div>
      </div>

      {/* Add Block Drawer */}
      {showAddDrawer && (
        <AddBlockDrawer
          onClose={() => {
            setShowAddDrawer(false);
            setSelectedInsertIndex(null);
          }}
          onAdd={handleBlockAdded}
        />
      )}
    </div>
  );
}

interface BadgeProps {
  icon: React.ReactNode;
  text: string;
}

function Badge({ icon, text }: BadgeProps) {
  return (
    <div className="glass-strong rounded-full px-3 py-1 flex items-center gap-1 text-white text-sm">
      {icon}
      <span>{text}</span>
    </div>
  );
}

interface BlockItemProps {
  block: Block;
}

function BlockItem({ block }: BlockItemProps) {
  if (block.type === 'poi') {
    return (
      <div className="flex gap-4">
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white">
            📍
          </div>
        </div>
        <div className="flex-1 glass-strong rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-white">{block.data.name}</h3>
            <button className="text-white/60 hover:text-white">
              <Navigation size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3 text-white/60 text-sm mb-2">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{block.data.time}</span>
            </div>
            <span>·</span>
            <span>{block.data.duration}</span>
          </div>
          {block.data.note && (
            <p className="text-white/80 text-sm">{block.data.note}</p>
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'transport') {
    return (
      <div className="flex gap-4">
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-white">
            🚇
          </div>
        </div>
        <div className="flex-1 glass rounded-xl p-3">
          <p className="text-white/80 text-sm">
            {block.data.method} · {block.data.duration}
          </p>
          <p className="text-white/60 text-xs mt-1">
            {block.data.from} → {block.data.to}
          </p>
        </div>
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div className="flex gap-4">
        <div className="w-12" />
        <div className="flex-1 glass rounded-xl p-3">
          <p className="text-white/80 text-sm">{block.data.content}</p>
        </div>
      </div>
    );
  }

  return null;
}

interface InsertButtonProps {
  onClick: () => void;
}

function InsertButton({ onClick }: InsertButtonProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="w-12 flex justify-center">
        <button
          onClick={onClick}
          className="w-8 h-8 rounded-full glass-strong flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 text-white/40 text-sm">👇 移动到这里 或 添加内容</div>
    </div>
  );
}
