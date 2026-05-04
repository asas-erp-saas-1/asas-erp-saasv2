'use server';

export async function getMetricsData() {
  return {
    revenueAccrualMTD: 42500000,
    pipelineWeightedValue: 125000000,
    cashBalance: 84000000,
    conversionRate: 15.2,
    activeLeads: 245,
    dealsClosed: 32,
    avgDealSize: 15000000,
    dealsWonPercentage: 68, // compared to lost
    liquidityMode: 'Standard',
    dataFreshness: 'fresh',
    salesByMonth: [
      { month: 'Jan', sales: 12 },
      { month: 'Fev', sales: 15 },
      { month: 'Mar', sales: 18 },
      { month: 'Avr', sales: 24 },
      { month: 'Mai', sales: 32 },
    ],
    revenueByMonth: [
      { month: 'Jan', rev: 18000000 },
      { month: 'Fev', rev: 22000000 },
      { month: 'Mar', rev: 27000000 },
      { month: 'Avr', rev: 35000000 },
      { month: 'Mai', rev: 42500000 },
    ]
  };
}
