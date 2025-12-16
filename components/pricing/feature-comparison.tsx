'use client';

import { useMemo } from 'react';
import { Check } from 'lucide-react';

interface FeatureComparisonProps {
  plans: any[];
}

export function FeatureComparison({ plans }: FeatureComparisonProps) {
  // Group plans by base name (e.g., "pro" and "pro annual" become "pro")
  const groupedPlans = useMemo(() => {
    const groups: Record<string, { monthly?: any; annual?: any }> = {};
    
    plans.forEach((plan) => {
      // Extract base name (remove " Annual" suffix)
      const baseName = plan.name.replace(/\s+Annual$/, '').toLowerCase();
      
      if (!groups[baseName]) {
        groups[baseName] = {};
      }
      
      if (plan.interval === 'month') {
        groups[baseName].monthly = plan;
      } else if (plan.interval === 'year') {
        groups[baseName].annual = plan;
      }
    });
    
    return groups;
  }, [plans]);

  // Collect all unique features from all plans for comparison table (use monthly plans for comparison)
  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>();
    Object.values(groupedPlans).forEach((group) => {
      const plan = group.monthly || group.annual;
      if (plan && plan.features && Array.isArray(plan.features)) {
        plan.features.forEach((feature: string) => featureSet.add(feature));
      }
    });
    // Add limits as separate features
    featureSet.add('Max Projects');
    featureSet.add('Renders per Project');
    return Array.from(featureSet).sort();
  }, [groupedPlans]);

  // Helper to get feature value for a plan
  const getPlanFeatureValue = (plan: any, feature: string): string | boolean => {
    // Check if it's a regular feature
    if (plan.features && Array.isArray(plan.features)) {
      if (plan.features.includes(feature)) {
        return true;
      }
    }
    
    // Handle special features
    if (feature === 'Max Projects') {
      if (plan.maxProjects === null || plan.maxProjects === undefined) {
        return 'Unlimited';
      }
      return plan.maxProjects.toString();
    }
    
    if (feature === 'Renders per Project') {
      if (plan.maxRendersPerProject === null || plan.maxRendersPerProject === undefined) {
        return 'Unlimited';
      }
      return plan.maxRendersPerProject.toString();
    }
    
    return false;
  };

  if (Object.keys(groupedPlans).length === 0 || allFeatures.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4 text-center">Feature Comparison</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse bg-card text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-muted/50 z-10">Feature</th>
              {Object.entries(groupedPlans).map(([baseName, group]) => {
                const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
                return (
                  <th key={baseName} className="text-center px-2 py-2 font-semibold min-w-[100px]">
                    {displayName}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((feature, index) => (
              <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 text-foreground font-medium sticky left-0 bg-card z-10">{feature}</td>
                {Object.values(groupedPlans).map((group, idx) => {
                  const plan = group.monthly || group.annual;
                  const featureValue = getPlanFeatureValue(plan, feature);
                  return (
                    <td key={idx} className="px-2 py-2 text-center">
                      {featureValue === true ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : typeof featureValue === 'string' ? (
                        <span className="font-medium text-foreground">{featureValue}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

