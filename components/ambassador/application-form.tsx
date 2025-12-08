'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { applyForAmbassadorAction } from '@/lib/actions/ambassador.actions';

export function AmbassadorApplicationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    socialMedia: '',
    whyInterested: '',
    audienceSize: '',
    marketingChannels: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      marketingChannels: prev.marketingChannels.includes(channel)
        ? prev.marketingChannels.filter(c => c !== channel)
        : [...prev.marketingChannels, channel]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await applyForAmbassadorAction(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/ambassador');
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit application');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          Application submitted successfully! Redirecting to your dashboard...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ambassador Application</CardTitle>
        <CardDescription>
          Fill out the form below to apply for our ambassador program
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <Label htmlFor="socialMedia">Social Media (Optional)</Label>
            <Input
              id="socialMedia"
              name="socialMedia"
              value={formData.socialMedia}
              onChange={handleChange}
              placeholder="@yourhandle or profile URL"
            />
          </div>

          <div>
            <Label htmlFor="whyInterested">Why are you interested in becoming an ambassador? *</Label>
            <Textarea
              id="whyInterested"
              name="whyInterested"
              value={formData.whyInterested}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Tell us about yourself and why you'd be a great ambassador..."
            />
          </div>

          <div>
            <Label htmlFor="audienceSize">Estimated Audience Size *</Label>
            <Input
              id="audienceSize"
              name="audienceSize"
              value={formData.audienceSize}
              onChange={handleChange}
              required
              placeholder="e.g., 1,000-5,000 followers"
            />
          </div>

          <div>
            <Label>Marketing Channels (Select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {['Social Media', 'Blog', 'YouTube', 'Podcast', 'Email List', 'Community'].map((channel) => (
                <label key={channel} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marketingChannels.includes(channel)}
                    onChange={() => handleCheckboxChange(channel)}
                    className="rounded"
                  />
                  <span className="text-sm">{channel}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

