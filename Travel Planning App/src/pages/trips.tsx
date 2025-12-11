import React, { useState } from 'react';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';

interface TripsPageProps {
  onNavigateToDetail: (tripId: string) => void;
}

type TripStatus = 'planning' | 'ongoing' | 'completed';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  status: TripStatus;
  progress: number;
  coverImage: string;
}

const mockTrips: Trip[] = [
  {
    id: '1',
    title: '巴黎浪漫之旅',
    destination: '法国·巴黎',
    startDate: '2025-03-15',
    endDate: '2025-03-20',
    days: 5,
    status: 'planning',
    progress: 60,
    coverImage: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc2NTQyMjE0MHww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '2',
    title: '东京深度游',
    destination: '日本·东京',
    startDate: '2025-04-01',
    endDate: '2025-04-07',
    days: 7,
    status: 'planning',
    progress: 30,
    coverImage: 'https://images.unsplash.com/photo-1663511172227-ab917d4bb4b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMHN0cmVldCUyMG5pZ2h0fGVufDF8fHx8MTc2NTM2NjE3Mnww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '3',
    title: '巴厘岛度假',
    destination: '印尼·巴厘岛',
    startDate: '2025-02-10',
    endDate: '2025-02-16',
    days: 6,
    status: 'completed',
    progress: 100,
    coverImage: 'https://images.unsplash.com/photo-1717501787981-d5f28eb2df5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwYmVhY2glMjBzdW5zZXR8ZW58MXx8fHwxNzY1MzQ2NDk5fDA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

const statusConfig = {
  planning: { label: '规划中', color: 'bg-blue-400' },
  ongoing: { label: '进行中', color: 'bg-green-400' },
  completed: { label: '已完成', color: 'bg-gray-400' }
};

export default function TripsPage({ onNavigateToDetail }: TripsPageProps) {
  const [filter, setFilter] = useState<TripStatus | 'all'>('all');

  const filteredTrips = filter === 'all' 
    ? mockTrips 
    : mockTrips.filter(trip => trip.status === filter);

  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white mb-2">我的行程</h1>
          <p className="text-white/70">共 {mockTrips.length} 个行程</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <FilterTab
            label="全部"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterTab
            label="规划中"
            active={filter === 'planning'}
            onClick={() => setFilter('planning')}
          />
          <FilterTab
            label="进行中"
            active={filter === 'ongoing'}
            onClick={() => setFilter('ongoing')}
          />
          <FilterTab
            label="已完成"
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
          />
        </div>

        {/* Trip List */}
        <div className="space-y-4">
          {filteredTrips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => onNavigateToDetail(trip.id)}
            />
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/60">暂无{filter !== 'all' ? statusConfig[filter].label : ''}行程</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterTab({ label, active, onClick }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
        active
          ? 'glass-strong text-white'
          : 'glass text-white/60 hover:text-white/80'
      }`}
    >
      {label}
    </button>
  );
}

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

function TripCard({ trip, onClick }: TripCardProps) {
  const statusInfo = statusConfig[trip.status];

  return (
    <div
      onClick={onClick}
      className="glass-strong rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform active:scale-95"
    >
      <div className="flex gap-3 p-4">
        {/* Cover Image */}
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-white mb-1">{trip.title}</h3>
              <div className="flex items-center gap-1 text-white/60 text-sm mb-1">
                <MapPin size={14} />
                <span>{trip.destination}</span>
              </div>
            </div>
            <ChevronRight className="text-white/40 flex-shrink-0" size={20} />
          </div>

          <div className="flex items-center gap-3 text-white/60 text-sm mb-2">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{trip.startDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{trip.days}天</span>
            </div>
          </div>

          {/* Status & Progress */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full ${statusInfo.color} text-white text-xs`}>
              {statusInfo.label}
            </span>
            {trip.status === 'planning' && (
              <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${trip.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
