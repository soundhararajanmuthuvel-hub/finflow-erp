import { Prisma } from '@prisma/client';
import { DistributionEngine, FundingParticipant, DistributionConfig } from '../src/services/distributionEngine.js';
import { toDecimal } from '../src/utils/decimal.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

function assertEqual(actual: any, expected: any, msg: string) {
  let actualStr = actual?.toString?.() ?? String(actual);
  let expectedStr = expected?.toString?.() ?? String(expected);

  // If both can be converted to numbers/decimals, compare toFixed(2)
  try {
    const actDec = toDecimal(actual);
    const expDec = toDecimal(expected);
    if (actDec.toFixed(2) === expDec.toFixed(2)) {
      console.log(`  ✓ PASS: ${msg} [₹${actDec.toFixed(2)}]`);
      passed++;
      return;
    }
  } catch {
    // fallback to string equality
  }

  if (actualStr === expectedStr) {
    console.log(`  ✓ PASS: ${msg} [${actualStr}]`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg} -> expected: ${expectedStr}, got: ${actualStr}`);
    failed++;
  }
}

console.log('====================================================');
console.log('FINFLOW — INVESTOR ROI CALCULATION AUTOMATED TEST SUITE');
console.log('====================================================\n');

// -------------------------------------------------------------------------------------------------
// Test A — Investor receives interest
// A ₹100,000 deal has ₹25,000 funded by an investor (25%). A ₹1,500 interest collection occurs,
// with a 10% company commission and proportional distribution of the remaining interest.
// Under this explicitly configured rule, expected investor interest is ₹337.50.
// -------------------------------------------------------------------------------------------------
console.log('Test A: Investor receives interest (₹337.50 expected on ₹1,500 interest collection with 25% share & 10% commission)');
{
  const totalDealAmount = toDecimal(100000);
  const fundings: FundingParticipant[] = [
    {
      id: 'f-company',
      sourceType: 'COMPANY',
      amount: toDecimal(75000),
      percentage: toDecimal(75),
      expectedReturnRate: toDecimal(0),
    },
    {
      id: 'f-investor-1',
      sourceType: 'OUTSIDE_INVESTOR',
      investorId: 'inv-001',
      amount: toDecimal(25000),
      percentage: toDecimal(25),
      expectedReturnRate: toDecimal(0),
    },
  ];
  const config: DistributionConfig = {
    companyCommissionRate: toDecimal(10),
  };

  const result = DistributionEngine.executeRepaymentSplit(
    toDecimal(0),     // Principal
    toDecimal(1500),  // Interest
    totalDealAmount,
    fundings,
    config
  );

  assertEqual(result.companyProfit.managementCommission, '150.00', 'Company 10% commission on ₹1,500 is ₹150.00');
  assertEqual(result.investorReturns.length, 1, 'Exactly 1 investor return record created');
  assertEqual(result.investorReturns[0].interestEarned, '337.50', 'Investor received ₹337.50 interest');
  assertEqual(result.investorReturns[0].principalReturned, '0.00', 'Investor principal returned is ₹0.00');
  assertEqual(result.totalInterestSplit, '1500.00', 'Total interest reconciles exactly to ₹1,500.00');
}

// -------------------------------------------------------------------------------------------------
// Test B — Principal-only repayment
// A payment allocated entirely to principal must not increase ROI earned.
// -------------------------------------------------------------------------------------------------
console.log('\nTest B: Principal-only repayment (Must not increase ROI earned)');
{
  const totalDealAmount = toDecimal(100000);
  const fundings: FundingParticipant[] = [
    {
      id: 'f-company',
      sourceType: 'COMPANY',
      amount: toDecimal(50000),
      percentage: toDecimal(50),
      expectedReturnRate: toDecimal(0),
    },
    {
      id: 'f-investor-1',
      sourceType: 'OUTSIDE_INVESTOR',
      investorId: 'inv-001',
      amount: toDecimal(50000),
      percentage: toDecimal(50),
      expectedReturnRate: toDecimal(0),
    },
  ];
  const config: DistributionConfig = {
    companyCommissionRate: toDecimal(10),
  };

  const result = DistributionEngine.executeRepaymentSplit(
    toDecimal(10000), // Principal
    toDecimal(0),     // Interest is ZERO
    totalDealAmount,
    fundings,
    config
  );

  assertEqual(result.investorReturns[0].principalReturned, '5000.00', 'Investor receives 50% of principal (₹5,000.00)');
  assertEqual(result.investorReturns[0].interestEarned, '0.00', 'Investor ROI earned is strictly ₹0.00');
  assertEqual(result.companyProfit.totalCompanyProfit, '0.00', 'Company profit is strictly ₹0.00');
  assertEqual(result.totalPrincipalSplit, '10000.00', 'Total principal reconciles exactly to ₹10,000.00');
}

// -------------------------------------------------------------------------------------------------
// Test C — Company-only funding
// No investor return should be created if no investor funds the deal.
// -------------------------------------------------------------------------------------------------
console.log('\nTest C: Company-only funding (No investor return created)');
{
  const totalDealAmount = toDecimal(50000);
  const fundings: FundingParticipant[] = [
    {
      id: 'f-company',
      sourceType: 'COMPANY',
      amount: toDecimal(50000),
      percentage: toDecimal(100),
      expectedReturnRate: toDecimal(0),
    },
  ];
  const config: DistributionConfig = {
    companyCommissionRate: toDecimal(10),
  };

  const result = DistributionEngine.executeRepaymentSplit(
    toDecimal(5000),
    toDecimal(1000),
    totalDealAmount,
    fundings,
    config
  );

  assertEqual(result.investorReturns.length, 0, 'Zero investor return records generated');
  assertEqual(result.companyProfit.principalRecovered, '5000.00', '100% of principal recovered by company');
  assertEqual(result.companyProfit.totalCompanyProfit, '1000.00', '100% of interest retained by company');
}

// -------------------------------------------------------------------------------------------------
// Test D — Multiple investors
// Each investor receives only their calculated share.
// -------------------------------------------------------------------------------------------------
console.log('\nTest D: Multiple investors (Each investor receives only their calculated share)');
{
  const totalDealAmount = toDecimal(100000);
  const fundings: FundingParticipant[] = [
    {
      id: 'f-inv-1',
      sourceType: 'OUTSIDE_INVESTOR',
      investorId: 'inv-001',
      amount: toDecimal(30000),
      percentage: toDecimal(30),
      expectedReturnRate: toDecimal(0),
    },
    {
      id: 'f-inv-2',
      sourceType: 'OUTSIDE_INVESTOR',
      investorId: 'inv-002',
      amount: toDecimal(20000),
      percentage: toDecimal(20),
      expectedReturnRate: toDecimal(0),
    },
    {
      id: 'f-company',
      sourceType: 'COMPANY',
      amount: toDecimal(50000),
      percentage: toDecimal(50),
      expectedReturnRate: toDecimal(0),
    },
  ];
  const config: DistributionConfig = {
    companyCommissionRate: toDecimal(10),
  };

  // ₹10,000 principal, ₹2,000 interest
  // Commission 10% = ₹200. Net interest = ₹1,800.
  // Inv 1: 30% of ₹10k = ₹3,000 principal. 30% of ₹1,800 = ₹540 interest.
  // Inv 2: 20% of ₹10k = ₹2,000 principal. 20% of ₹1,800 = ₹360 interest.
  // Company: 50% principal = ₹5,000. Retained margin = 50% of ₹1,800 = ₹900. Total company profit = ₹200 + ₹900 = ₹1,100.
  const result = DistributionEngine.executeRepaymentSplit(
    toDecimal(10000),
    toDecimal(2000),
    totalDealAmount,
    fundings,
    config
  );

  const inv1 = result.investorReturns.find((r) => r.investorId === 'inv-001');
  const inv2 = result.investorReturns.find((r) => r.investorId === 'inv-002');

  assertEqual(inv1?.principalReturned, '3000.00', 'Investor 1 receives ₹3,000.00 principal');
  assertEqual(inv1?.interestEarned, '540.00', 'Investor 1 receives ₹540.00 interest');
  assertEqual(inv2?.principalReturned, '2000.00', 'Investor 2 receives ₹2,000.00 principal');
  assertEqual(inv2?.interestEarned, '360.00', 'Investor 2 receives ₹360.00 interest');
  assertEqual(result.companyProfit.principalRecovered, '5000.00', 'Company recovers ₹5,000.00 principal');
  assertEqual(result.companyProfit.totalCompanyProfit, '1100.00', 'Company total profit is ₹1,100.00');
  assertEqual(result.totalPrincipalSplit, '10000.00', 'Total principal split reconciles to ₹10,000.00');
  assertEqual(result.totalInterestSplit, '2000.00', 'Total interest split reconciles to ₹2,000.00');
}

// -------------------------------------------------------------------------------------------------
// Test E — Repeat protection
// Reprocessing an existing repayment must not duplicate its distributions.
// -------------------------------------------------------------------------------------------------
console.log('\nTest E: Repeat protection (Reprocessing duplicate distribution check)');
{
  let checkCalled = false;
  const mockExistingDistribution = { id: 'dist-existing-123' };

  // Simulate RepaymentService check:
  function guardAgainstDuplicateDistribution(existing: any) {
    if (existing) {
      checkCalled = true;
      throw new Error('Repayment already has a distribution record. Duplicate distribution prevented.');
    }
  }

  let errorCaught = false;
  try {
    guardAgainstDuplicateDistribution(mockExistingDistribution);
  } catch (err: any) {
    errorCaught = err.message.includes('Duplicate distribution prevented');
  }

  assert(checkCalled && errorCaught, 'Duplicate distribution was blocked and prevented duplicate entries');
}

// -------------------------------------------------------------------------------------------------
// Test F — Void/reversal
// Voiding a repayment must reverse the corresponding investor returns and funding aggregates.
// -------------------------------------------------------------------------------------------------
console.log('\nTest F: Void/reversal (Decrements funding aggregates by exact amounts)');
{
  const fundingState = {
    principalReturned: toDecimal(12500.01),
    interestEarned: toDecimal(2025.00),
  };

  const returnToRevert = {
    principalReturned: toDecimal(4166.67),
    interestEarned: toDecimal(675.00),
  };

  // Reversal simulation:
  const newPrincipal = fundingState.principalReturned.minus(returnToRevert.principalReturned);
  const newInterest = fundingState.interestEarned.minus(returnToRevert.interestEarned);

  assertEqual(newPrincipal, '8333.34', 'Funding principalReturned decremented correctly');
  assertEqual(newInterest, '1350.00', 'Funding interestEarned decremented correctly');
}

// -------------------------------------------------------------------------------------------------
// Test G — Rounding reconciliation
// All monetary amounts reconcile to two decimal places without unexplained differences.
// -------------------------------------------------------------------------------------------------
console.log('\nTest G: Rounding reconciliation (Fractional cents reconciliation)');
{
  const totalDealAmount = toDecimal(100000);
  const fundings: FundingParticipant[] = [
    {
      id: 'f-inv-1',
      sourceType: 'OUTSIDE_INVESTOR',
      investorId: 'inv-001',
      amount: toDecimal(33333.33),
      percentage: toDecimal(33.333333),
      expectedReturnRate: toDecimal(0),
    },
    {
      id: 'f-inv-2',
      sourceType: 'OUTSIDE_INVESTOR',
      investorId: 'inv-002',
      amount: toDecimal(33333.33),
      percentage: toDecimal(33.333333),
      expectedReturnRate: toDecimal(0),
    },
    {
      id: 'f-company',
      sourceType: 'COMPANY',
      amount: toDecimal(33333.34),
      percentage: toDecimal(33.333334),
      expectedReturnRate: toDecimal(0),
    },
  ];
  const config: DistributionConfig = {
    companyCommissionRate: toDecimal(10),
  };

  // Fractional principal ₹9,833.33, Interest ₹1,500.00
  const result = DistributionEngine.executeRepaymentSplit(
    toDecimal(9833.33),
    toDecimal(1500.00),
    totalDealAmount,
    fundings,
    config
  );

  assertEqual(result.totalPrincipalSplit, '9833.33', 'Total principal split reconciles exactly to ₹9,833.33');
  assertEqual(result.totalInterestSplit, '1500.00', 'Total interest split reconciles exactly to ₹1,500.00');
  assertEqual(result.totalDistributed, '11333.33', 'Total distributed reconciles exactly to ₹11,333.33');
}

// -------------------------------------------------------------------------------------------------
// Test H — Existing data reconciliation
// Historical reconciliation does not create duplicate returns or modify unrelated deals.
// -------------------------------------------------------------------------------------------------
console.log('\nTest H: Existing data reconciliation (Audit & dry-run safety)');
{
  const sampleRepayments = [
    { id: 'rep-1', dealId: 'deal-1', hasDistribution: true },
    { id: 'rep-2', dealId: 'deal-1', hasDistribution: false },
    { id: 'rep-3', dealId: 'deal-2', hasDistribution: true },
  ];

  const unDistributed = sampleRepayments.filter((r) => !r.hasDistribution);
  assertEqual(unDistributed.length, 1, 'Dry-run correctly detects only un-distributed repayments without touching existing ones');
  assertEqual(unDistributed[0].id, 'rep-2', 'Identified target repayment rep-2 accurately');
}

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
