'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreditTransactions } from '@/lib/hooks/use-credit-transactions';
import { ArrowUpRight, ArrowDownLeft, Gift, RefreshCw, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ITEMS_PER_PAGE = 5;

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

export function RecentTransactionsPaginated() {
  const { transactions, loading } = useCreditTransactions();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil((transactions?.length || 0) / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = useMemo(
    () => (transactions || []).slice(startIndex, endIndex),
    [transactions, startIndex, endIndex]
  );

  if (loading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="shrink-0">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest credit transactions and usage</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 h-[400px]">
          <div className="space-y-3 flex-1">
            {[...Array(5)].map((_, i) => (
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

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your latest credit transactions and usage</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/billing/history">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 h-[400px]">
        {transactions && transactions.length > 0 ? (
          <>
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
              {currentTransactions.map((transaction) => {
                const Icon = transactionIcons[transaction.type];
                const colorClass = transactionColors[transaction.type];
                const isPositive = transaction.amount > 0;
                
                return (
                  <div key={transaction.id} className="flex items-center space-x-4 p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'earned' ? 'bg-green-100 dark:bg-green-900/20' :
                      transaction.type === 'spent' ? 'bg-destructive/10' :
                      transaction.type === 'refund' ? 'bg-blue-100 dark:bg-blue-900/20' :
                      'bg-purple-100 dark:bg-purple-900/20'
                    }`}>
                      <Icon className={`h-5 w-5 ${colorClass}`} />
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
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`text-sm font-medium ${
                        isPositive ? 'text-green-600 dark:text-green-400' : 'text-destructive'
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
              {/* Placeholder items to maintain height */}
              {currentTransactions.length < ITEMS_PER_PAGE && Array.from({ length: ITEMS_PER_PAGE - currentTransactions.length }).map((_, i) => (
                <div key={`placeholder-${i}`} className="h-[73px] opacity-0 pointer-events-none" aria-hidden="true" />
              ))}
            </div>
            
            {/* Pagination - Always show */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">
                {transactions.length > 0 ? (
                  <>Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length}</>
                ) : (
                  <>No transactions</>
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
                <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transactions yet</p>
                <p className="text-xs">Your credit transaction history will appear here</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/render">
                    Start Creating
                  </Link>
                </Button>
              </div>
            </div>
            {/* Pagination - Always show even when empty */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">No transactions</div>
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

