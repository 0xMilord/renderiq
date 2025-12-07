'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpRight, ArrowDownLeft, Gift, RefreshCw, Loader2, Filter, Download } from 'lucide-react';
import { useCreditTransactions } from '@/lib/hooks/use-credit-transactions';
import { format } from 'date-fns';

const transactionIcons = {
  earned: ArrowUpRight,
  spent: ArrowDownLeft,
  refund: RefreshCw,
  bonus: Gift,
};

const transactionColors = {
  earned: 'text-green-600 dark:text-green-400',
  spent: 'text-destructive',
  refund: 'text-blue-600 dark:text-blue-400',
  bonus: 'text-purple-600 dark:text-purple-400',
};

const transactionBgColors = {
  earned: 'bg-green-100 dark:bg-green-900/20',
  spent: 'bg-destructive/10',
  refund: 'bg-blue-100 dark:bg-blue-900/20',
  bonus: 'bg-purple-100 dark:bg-purple-900/20',
};

export default function CreditTransactionsPage() {
  const { transactions, loading, refreshTransactions } = useCreditTransactions();
  const [filters, setFilters] = useState({
    type: 'all' as 'earned' | 'spent' | 'refund' | 'bonus' | 'all',
    search: '',
  });

  // Memoize filtered transactions to avoid recalculating on every render
  const filteredTransactions = useMemo(() => {
    if (!transactions) {
      return [];
    }

    let filtered = [...transactions];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Filter by search (description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [transactions, filters]);

  // Memoize summary calculations
  const summaryStats = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        totalEarned: 0,
        totalSpent: 0,
        refundCount: 0,
        bonusCount: 0,
      };
    }

    return {
      totalEarned: filteredTransactions
        .filter(t => t.type === 'earned' || t.type === 'bonus' || t.type === 'refund')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalSpent: filteredTransactions
        .filter(t => t.type === 'spent')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      refundCount: filteredTransactions.filter(t => t.type === 'refund').length,
      bonusCount: filteredTransactions.filter(t => t.type === 'bonus').length,
    };
  }, [filteredTransactions]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'earned':
        return 'Earned';
      case 'spent':
        return 'Spent';
      case 'refund':
        return 'Refund';
      case 'bonus':
        return 'Bonus';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading credit transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Credit Transactions
                </CardTitle>
                <CardDescription>
                  Complete history of all credit transactions including usage, purchases, refunds, and bonuses
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refreshTransactions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full"
                />
              </div>
              <Select
                value={filters.type}
                onValueChange={(value: any) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="spent">Spent</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions Table */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">
                  {transactions?.length === 0 
                    ? 'No credit transactions yet' 
                    : 'No transactions match your filters'}
                </p>
                {transactions?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Your credit transaction history will appear here once you start using credits
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const Icon = transactionIcons[transaction.type];
                      const colorClass = transactionColors[transaction.type];
                      const bgColorClass = transactionBgColors[transaction.type];
                      const isPositive = transaction.amount > 0;
                      const date = new Date(transaction.createdAt);
                      
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColorClass}`}>
                              <Icon className={`h-4 w-4 ${colorClass}`} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{transaction.description}</span>
                              <Badge variant="outline" className="w-fit mt-1 text-xs">
                                {getTransactionTypeLabel(transaction.type)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${isPositive ? colorClass : 'text-destructive'}`}>
                              {isPositive ? '+' : ''}{transaction.amount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{format(date, 'MMM dd, yyyy')}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(date, 'HH:mm:ss')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.referenceType && transaction.referenceId ? (
                              <div className="flex flex-col">
                                <Badge variant="secondary" className="w-fit text-xs">
                                  {transaction.referenceType}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono mt-1">
                                  {transaction.referenceId.slice(0, 8)}...
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary Stats */}
            {filteredTransactions.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{summaryStats.totalEarned}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Total Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    -{summaryStats.totalSpent}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {summaryStats.refundCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Refunds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {summaryStats.bonusCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Bonuses</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

