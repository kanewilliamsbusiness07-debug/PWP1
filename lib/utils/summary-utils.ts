import { convertClientToInputs } from './convertClientToInputs';
import { calculateFinancialProjections } from './calculateFinancialProjections';

export interface SummaryResult {
  clientName: string;
  projectedRetirementLumpSum: number;
  projectedRetirementMonthlyCashFlow: number;
  retirementDeficitSurplus: number;
  isRetirementDeficit: boolean;
  yearsToRetirement: number;
}

/**
 * Compute the display summary for a client. If storedProjectionResults are provided, prefer them.
 * Otherwise compute using canonical projection functions and return the values.
 */
export function computeSummaryFromClient(client: any, sharedAssumptions: any, storedProjectionResults?: any): SummaryResult {
  const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' : 'Client';

  if (storedProjectionResults) {
    return {
      clientName,
      projectedRetirementLumpSum: storedProjectionResults.projectedLumpSum || 0,
      projectedRetirementMonthlyCashFlow: storedProjectionResults.monthlyPassiveIncome || 0,
      retirementDeficitSurplus: storedProjectionResults.monthlyDeficitSurplus || 0,
      isRetirementDeficit: !!storedProjectionResults.isDeficit,
      yearsToRetirement: storedProjectionResults.yearsToRetirement || 0,
    };
  }

  // Compute locally using canonical convert + projection
  const inputs = convertClientToInputs(client, sharedAssumptions);
  if (!inputs) {
    return {
      clientName,
      projectedRetirementLumpSum: 0,
      projectedRetirementMonthlyCashFlow: 0,
      retirementDeficitSurplus: 0,
      isRetirementDeficit: false,
      yearsToRetirement: Math.max(0, (client?.retirementAge || 65) - (client?.currentAge || 35)),
    };
  }

  const results = calculateFinancialProjections(inputs);

  return {
    clientName,
    projectedRetirementLumpSum: results.combinedNetworthAtRetirement || 0,
    projectedRetirementMonthlyCashFlow: (results.projectedAnnualPassiveIncome / 12) || 0,
    retirementDeficitSurplus: results.monthlySurplusDeficit || 0,
    isRetirementDeficit: results.status === 'deficit',
    yearsToRetirement: results.yearsToRetirement || 0,
  };
}