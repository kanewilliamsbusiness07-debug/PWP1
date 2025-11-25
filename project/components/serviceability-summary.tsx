import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceabilityResult } from "@/lib/finance/serviceability";
import { formatCurrency } from "@/lib/utils/format";
import { BadgeDollarSign, Home, TrendingUp } from "lucide-react";

interface ServiceabilitySummaryProps {
  serviceability: ServiceabilityResult;
  monthlyIncome: number;
}

export function ServiceabilitySummary({ serviceability, monthlyIncome }: ServiceabilitySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <Home className="h-5 w-5" />
          Investment Property Potential
        </CardTitle>
        <CardDescription>
          Based on your surplus income above 70% retention threshold
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Maximum Property Value
              </CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(serviceability.maxPropertyValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With {(serviceability.loanToValueRatio * 100).toFixed(0)}% LVR
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Surplus
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(serviceability.surplusIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available for investment
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expected Rental Income
              </CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(serviceability.monthlyRentalIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Monthly Cash Flow Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Loan Payment</span>
              <span className="font-medium text-foreground">{formatCurrency(serviceability.maxMonthlyPayment)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Property Expenses</span>
              <span className="font-medium text-foreground">{formatCurrency(serviceability.totalMonthlyExpenses)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Rental Income</span>
              <span className="font-medium text-foreground">{formatCurrency(serviceability.monthlyRentalIncome)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 text-foreground">
              <span>Net Cash Flow</span>
              <span>{formatCurrency(
                serviceability.monthlyRentalIncome - 
                serviceability.maxMonthlyPayment - 
                serviceability.totalMonthlyExpenses
              )}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}