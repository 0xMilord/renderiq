'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Image as ImageIcon, ChevronLeft, ChevronRight, Video, Heart, Sparkles } from 'lucide-react';
import type { ActivityItem } from '@/lib/dal/activity';
import Link from 'next/link';

interface RecentActivityPaginatedProps {
  activities: ActivityItem[];
}

const ITEMS_PER_PAGE = 5;

export function RecentActivityPaginated({ activities }: RecentActivityPaginatedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.max(1, Math.ceil(activities.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentActivities = useMemo(
    () => activities.slice(startIndex, endIndex),
    [activities, startIndex, endIndex]
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Your latest activity
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 h-[400px]">
        {activities.length > 0 ? (
          <>
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
              {currentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {activity.type === 'render' && activity.render ? (
                        activity.render.status === 'completed' && activity.render.outputUrl ? (
                          activity.render.type === 'video' ? (
                            <video
                              src={activity.render.outputUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={activity.render.outputUrl}
                              alt={activity.render.prompt || 'Render'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                                }
                              }}
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {activity.render.type === 'video' ? (
                              <Video className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        )
                      ) : activity.type === 'like' && activity.like ? (
                        activity.like.render.status === 'completed' && activity.like.render.outputUrl ? (
                          activity.like.render.type === 'video' ? (
                            <video
                              src={activity.like.render.outputUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={activity.like.render.outputUrl}
                              alt={activity.like.render.prompt || 'Liked render'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></div>';
                                }
                              }}
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {activity.type === 'like' && (
                          <Heart className="h-3 w-3 text-primary shrink-0" />
                        )}
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {activity.type === 'render' && activity.render
                            ? activity.render.prompt
                            : activity.type === 'like' && activity.like
                            ? `Liked "${activity.like.render.prompt}"`
                            : 'Activity'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    activity.type === 'like' 
                      ? 'secondary'
                      : activity.render?.status === 'completed' 
                      ? 'default' 
                      : activity.render?.status === 'processing' 
                      ? 'secondary' 
                      : activity.render?.status === 'failed' 
                      ? 'destructive' 
                      : 'outline'
                  }>
                    {activity.type === 'like' ? 'Liked' : activity.render?.status || 'Unknown'}
                  </Badge>
                </div>
              ))}
              {/* Placeholder items to maintain height */}
              {currentActivities.length < ITEMS_PER_PAGE && Array.from({ length: ITEMS_PER_PAGE - currentActivities.length }).map((_, i) => (
                <div key={`placeholder-${i}`} className="h-[73px] opacity-0 pointer-events-none" aria-hidden="true" />
              ))}
            </div>
            
            {/* Pagination - Always show */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">
                {activities.length > 0 ? (
                  <>Showing {startIndex + 1}-{Math.min(endIndex, activities.length)} of {activities.length}</>
                ) : (
                  <>No activity</>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {totalPages > 0 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = 
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);
                      
                      if (showEllipsis) {
                        return <span key={page} className="px-1 text-muted-foreground text-xs">...</span>;
                      }
                      
                      if (!showPage) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground px-2">1</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs">Start creating renders or like some gallery items</p>
              </div>
            </div>
            {/* Pagination - Always show even when empty */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">No activity</div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">1</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

