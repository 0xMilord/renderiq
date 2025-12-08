'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2, Mail, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PendingReviewProps {
  applicationDate?: Date | string;
}

export function PendingReview({ applicationDate }: PendingReviewProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Recently';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Animated Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Animated Clock Icon */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                <Clock className="h-16 w-16 text-primary relative z-10" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Application Under Review
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Thank you for applying to become a Renderiq Ambassador! We're reviewing your application and will notify you soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Track your application progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1: Submitted */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-10 w-10 rounded-full bg-primary flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                  </motion.div>
                  <div className="absolute left-1/2 top-10 w-0.5 h-12 bg-border -translate-x-1/2" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-foreground">Application Submitted</h3>
                  <p className="text-sm text-muted-foreground">
                    Your application was received on {formatDate(applicationDate)}
                  </p>
                </div>
              </div>

              {/* Step 2: Under Review */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Clock className="h-5 w-5 text-primary" />
                    </motion.div>
                  </motion.div>
                  <div className="absolute left-1/2 top-10 w-0.5 h-12 bg-border -translate-x-1/2" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-foreground">Under Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Our team is carefully reviewing your application
                  </p>
                </div>
              </div>

              {/* Step 3: Decision */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-muted-foreground">Decision</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email notification once a decision is made
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What Happens Next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Review Process</h4>
                  <p className="text-sm text-muted-foreground">
                    Our team reviews each application carefully, typically within 2-3 business days.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Email Notification</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email with the decision and next steps if approved.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Get Started</h4>
                  <p className="text-sm text-muted-foreground">
                    Once approved, you'll get your unique referral code and can start earning commissions!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

