'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreditTransactions } from '@/lib/hooks/use-credit-transactions';
import { ArrowUpRight, ArrowDownLeft, Gift, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const transactionIcons = {
  earned: ArrowUpRight,
  spent: ArrowDownLeft,
  refund: RefreshCw,
  bonus: Gift,
};

const transactionColors = {
  earned: 'text-green-600',
  spent: 'text-destructive',
  refund: 'text-blue-600',
  bonus: 'text-purple-600',
};

export function RecentTransactions() {
  const { transactions, loading } = useCreditTransactions();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your credit transaction history will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No transactions yet</p>
            <Button asChild variant="outline">
              <Link href="/upload">
                Start Creating
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your latest credit transactions and usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((transaction) => {
            const Icon = transactionIcons[transaction.type];
            const colorClass = transactionColors[transaction.type];
            const isPositive = transaction.amount > 0;
            
            return (
              <div key={transaction.id} className="flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.type === 'earned' ? 'bg-green-100' :
                  transaction.type === 'spent' ? 'bg-destructive/10' :
                  transaction.type === 'refund' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                    {new Date(transaction.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-destructive'
                  }`}>
                    {isPositive ? '+' : ''}{transaction.amount}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {transaction.type}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button asChild variant="outline" className="w-full">
            <Link href="/billing/credits/history">
              View All Transactions
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
