'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, Video, Download, Share } from 'lucide-react';

interface Activity {
  id: string;
  type: 'render' | 'download' | 'share' | 'project';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'processing' | 'failed';
  thumbnail?: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const defaultActivities: Activity[] = [
    {
      id: '1',
      type: 'render',
      title: 'Exterior Render Completed',
      description: 'Modern house exterior with glass facade',
      timestamp: '2 hours ago',
      status: 'completed',
      thumbnail: '/placeholder-render.jpg',
    },
    {
      id: '2',
      type: 'project',
      title: 'New Project Created',
      description: 'Interior design for living room',
      timestamp: '1 day ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'render',
      title: 'Interior Render Processing',
      description: 'Minimalist kitchen design',
      timestamp: '3 hours ago',
      status: 'processing',
    },
    {
      id: '4',
      type: 'download',
      title: 'Project Downloaded',
      description: 'Exterior render package (4 files)',
      timestamp: '2 days ago',
      status: 'completed',
    },
  ];

  const userActivities = activities || defaultActivities;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'render':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      case 'share':
        return <Share className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your latest renders, projects, and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.timestamp}
                </p>
              </div>
              {activity.thumbnail && (
                <div className="flex-shrink-0">
                  <img
                    src={activity.thumbnail}
                    alt="Activity thumbnail"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
