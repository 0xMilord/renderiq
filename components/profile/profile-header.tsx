'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useUserBillingStats } from '@/lib/hooks/use-subscription';
import { Edit, Camera, MapPin, Globe, Calendar } from 'lucide-react';
import { useState } from 'react';
import { ProfileEditForm } from './profile-edit-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ProfileHeader() {
  const { profile, loading } = useUserProfile();
  const { data: billingStats } = useUserBillingStats(profile?.id);
  const isPro = billingStats?.isPro || false;
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Please sign in to view your profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar || ''} alt={profile.name || 'User'} />
              <AvatarFallback className="text-lg">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              onClick={() => setIsEditing(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground truncate">
                {profile.name || 'Anonymous User'}
              </h2>
              {isPro && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  PRO
                </Badge>
              )}
              <Badge variant={profile.isActive ? 'secondary' : 'outline'}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <p className="text-muted-foreground mb-4">
              {profile.bio || 'No bio provided'}
            </p>

            {/* Profile Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {profile.email && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="font-medium">Email:</span>
                  <span>{profile.email}</span>
                </div>
              )}
              
              {profile.location && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.website && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a 
                    href={profile.website}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileEditForm onClose={() => setIsEditing(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
