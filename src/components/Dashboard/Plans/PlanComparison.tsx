'use client';

import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { Plan, BOLT_FEATURES } from '@/utils/plans';

interface PlanComparisonProps {
  plans: Plan[];
}

export function PlanComparison({ plans }: PlanComparisonProps) {
  // Get all unique features across all plans
  const allFeatures = Array.from(
    new Set(plans.flatMap((plan) => plan.features))
  ).sort();

  return (
    <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
      <CardBody className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-6">Compare Plans</h3>
        <div className="overflow-x-auto">
          <Table aria-label="Plan comparison">
            <TableHeader>
              <TableColumn>Feature</TableColumn>
              {(plans.map((plan) => (
                <TableColumn key={plan.id} className="text-center" textValue={plan.name}>
                  {plan.name}
                </TableColumn>
              )) as unknown as React.ReactElement)}
            </TableHeader>
            <TableBody emptyContent="No features to compare">
              {allFeatures
                .map((featureCode) => {
                  const feature = BOLT_FEATURES[featureCode as keyof typeof BOLT_FEATURES];
                  if (!feature) return null;

                  return (
                    <TableRow key={featureCode}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{feature.name}</p>
                          <p className="text-xs text-foreground/60">{feature.description}</p>
                        </div>
                      </TableCell>
                      {(plans.map((plan) => {
                        const hasFeature = plan.features.includes(featureCode);
                        return (
                          <TableCell key={plan.id} className="text-center">
                            {hasFeature ? (
                              <svg className="w-5 h-5 text-success mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-foreground/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </TableCell>
                        );
                      }) as unknown as React.ReactElement)}
                    </TableRow>
                  );
                })
                .filter((row): row is React.ReactElement => row !== null)}
            </TableBody>
          </Table>
        </div>
      </CardBody>
    </Card>
  );
}

