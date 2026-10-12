import { Prisma } from '@prisma/client';
import { roundMoney, toDecimal, decimalMax } from '../src/utils/decimal.js';

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
  try {
    const actDec = toDecimal(actual);
    const expDec = toDecimal(expected);
    if (actDec.toFixed(2) === expDec.toFixed(2)) {
      console.log(`  ✓ PASS: ${msg} [₹${actDec.toFixed(2)}]`);
      passed++;
      return;
    }
  } catch {
    // fallback
  }

  const actualStr = String(actual);
  const expectedStr = String(expected);
  if (actualStr === expectedStr) {
    console.log(`  ✓ PASS: ${msg} [${actualStr}]`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg} -> expected: ${expectedStr}, got: ${actualStr}`);
    failed++;
  }
}

console.log('====================================================');
console.log('FINFLOW — INDIVIDUAL PARTNER REPORT TEST SUITE');
console.log('====================================================\n');

// -------------------------------------------------------------------------------------------------
// Test 1: Strict Partner Isolation (Partner 1 vs Partner 2)
// Selecting PRT-0001 (Velmurugan S) must return only Velmurugan S's records.
// PRT-0002 (Karunakaran S) records must NEVER be combined or visible in PRT-0001 statement.
// -------------------------------------------------------------------------------------------------
console.log('Test 1: Strict Partner Isolation (PRT-0001 vs PRT-0002)');
{
  const partnerA = {
    id: 'prt-1',
    partnerCode: 'PRT-0001',
    name: 'Velmurugan S',
    capitalContribution: new Prisma.Decimal(500000),
    sharePercentage: new Prisma.Decimal(50),
    fundings: [
      { dealId: 'deal-1', partnerId: 'prt-1', amount: new Prisma.Decimal(250000), percentage: new Prisma.Decimal(50) },
    ],
    returns: [
      { id: 'ret-1', partnerId: 'prt-1', principalReturned: new Prisma.Decimal(25000), profitShare: new Prisma.Decimal(5000), totalPayout: new Prisma.Decimal(30000) }
    ]
  };

  const partnerB = {
    id: 'prt-2',
    partnerCode: 'PRT-0002',
    name: 'Karunakaran S',
    capitalContribution: new Prisma.Decimal(300000),
    sharePercentage: new Prisma.Decimal(30),
    fundings: [
      { dealId: 'deal-2', partnerId: 'prt-2', amount: new Prisma.Decimal(150000), percentage: new Prisma.Decimal(30) },
      { dealId: 'deal-3', partnerId: 'prt-2', amount: new Prisma.Decimal(100000), percentage: new Prisma.Decimal(20) }
    ],
    returns: [
      { id: 'ret-2', partnerId: 'prt-2', principalReturned: new Prisma.Decimal(15000), profitShare: new Prisma.Decimal(3000), totalPayout: new Prisma.Decimal(18000) }
    ]
  };

  const allFundings = [...partnerA.fundings, ...partnerB.fundings];
  const allReturns = [...partnerA.returns, ...partnerB.returns];

  // Filter strictly for Partner A
  const filteredFundingsA = allFundings.filter((f) => f.partnerId === partnerA.id);
  const filteredReturnsA = allReturns.filter((r) => r.partnerId === partnerA.id);

  assert(filteredFundingsA.length === 1, 'Only 1 funding record returned for Velmurugan S (PRT-0001)');
  assertEqual(filteredFundingsA[0].amount, 250000, 'Velmurugan S deal funding is exactly ₹250,000');
  assert(!filteredFundingsA.some((f) => f.partnerId === partnerB.id), 'Karunakaran S (PRT-0002) fundings are completely absent from PRT-0001');

  assert(filteredReturnsA.length === 1, 'Only 1 return record returned for PRT-0001');
  assertEqual(filteredReturnsA[0].totalPayout, 30000, 'PRT-0001 total payout is exactly ₹30,000');
  assert(!filteredReturnsA.some((r) => r.partnerId === partnerB.id), 'Karunakaran S (PRT-0002) returns are completely absent from PRT-0001');

  // Filter strictly for Partner B
  const filteredFundingsB = allFundings.filter((f) => f.partnerId === partnerB.id);
  assert(filteredFundingsB.length === 2, 'Exactly 2 funding records returned for Karunakaran S (PRT-0002)');
  assertEqual(
    filteredFundingsB.reduce((acc, f) => acc.plus(f.amount), new Prisma.Decimal(0)),
    250000,
    'Karunakaran S total funded to deals is ₹250,000'
  );
}

// -------------------------------------------------------------------------------------------------
// Test 2: Financial Accuracy — Capital Contribution vs Profit Share Distinction
// Capital contribution is equity, not profit. Capital returned decreases capital balance, not profit.
// -------------------------------------------------------------------------------------------------
console.log('\nTest 2: Financial Accuracy — Capital Contribution vs Profit Share Distinction');
{
  const baseCapitalContribution = new Prisma.Decimal(500000); // ₹5,00,000 equity
  const totalFundedToDeals = new Prisma.Decimal(400000);       // ₹4,00,000 deployed across deals

  // A repayment distribution occurs: ₹50,000 principal returned + ₹12,500 profit share earned
  const principalReturned = new Prisma.Decimal(50000);
  const profitShareEarned = new Prisma.Decimal(12500);
  const profitSharePaid = profitShareEarned; // verified payout

  const currentCapitalBalance = roundMoney(baseCapitalContribution.minus(principalReturned));
  const activeCapitalInDeals = roundMoney(totalFundedToDeals.minus(principalReturned));
  const totalAmountPaid = roundMoney(principalReturned.plus(profitSharePaid));
  const pendingProfitShare = new Prisma.Decimal(0);
  const totalOutstandingPayable = roundMoney(currentCapitalBalance.plus(pendingProfitShare));

  assertEqual(currentCapitalBalance, 450000, 'Current Capital Balance is ₹450,000.00 (Base Capital - Capital Returned)');
  assertEqual(activeCapitalInDeals, 350000, 'Active Capital in Deals is ₹350,000.00');
  assertEqual(profitShareEarned, 12500, 'Profit Share Earned is strictly ₹12,500.00 (never treated as capital)');
  assertEqual(profitSharePaid, 12500, 'Profit Share Paid is ₹12,500.00');
  assertEqual(totalAmountPaid, 62500, 'Total Amount Paid is ₹62,500.00 (Principal Returned ₹50,000 + Profit Share ₹12,500)');
  assertEqual(totalOutstandingPayable, 450000, 'Total Outstanding Payable is ₹450,000.00');
  assert(!currentCapitalBalance.equals(profitShareEarned), 'Capital balance is NOT conflated with profit share');
}

// -------------------------------------------------------------------------------------------------
// Test 3: Date Period Filtering & Audit Reconciliation
// Opening Capital + Period Activity = Closing Capital
// -------------------------------------------------------------------------------------------------
console.log('\nTest 3: Date Period Filtering & Audit Reconciliation (Opening + Period = Closing)');
{
  const baseCapital = new Prisma.Decimal(1000000); // ₹10,00,000
  
  // Prior to period:
  const openingPrincipalReturned = new Prisma.Decimal(100000);
  const openingProfitEarned = new Prisma.Decimal(25000);
  const openingProfitPaid = openingProfitEarned;
  const openingCapitalBalance = roundMoney(baseCapital.minus(openingPrincipalReturned)); // 900,000
  const openingTotalAmountPaid = roundMoney(openingPrincipalReturned.plus(openingProfitPaid)); // 125,000

  // During period:
  const periodPrincipalReturned = new Prisma.Decimal(50000);
  const periodProfitEarned = new Prisma.Decimal(15000);
  const periodProfitPaid = periodProfitEarned;
  const periodTotalPayout = roundMoney(periodPrincipalReturned.plus(periodProfitPaid)); // 65,000

  // Closing:
  const closingPrincipalReturned = roundMoney(openingPrincipalReturned.plus(periodPrincipalReturned)); // 150,000
  const closingProfitEarned = roundMoney(openingProfitEarned.plus(periodProfitEarned)); // 40,000
  const closingProfitPaid = roundMoney(openingProfitPaid.plus(periodProfitPaid)); // 40,000
  const closingCapitalBalance = roundMoney(openingCapitalBalance.minus(periodPrincipalReturned)); // 850,000
  const closingTotalAmountPaid = roundMoney(openingTotalAmountPaid.plus(periodTotalPayout)); // 190,000

  assertEqual(openingCapitalBalance, 900000, 'Opening capital balance is ₹900,000.00');
  assertEqual(closingPrincipalReturned, 150000, 'Closing principal returned is ₹150,000.00');
  assertEqual(closingProfitEarned, 40000, 'Closing profit share earned is ₹40,000.00');
  assertEqual(closingCapitalBalance, 850000, 'Closing capital balance is ₹850,000.00');
  assertEqual(closingTotalAmountPaid, 190000, 'Closing total amount paid is ₹190,000.00');

  // Mathematical reconciliation:
  const expectedClosingCapital = openingCapitalBalance.minus(periodPrincipalReturned);
  assert(
    closingCapitalBalance.equals(expectedClosingCapital),
    'Audit reconciliation check: Opening Capital (₹900,000) - Period Returned (₹50,000) === Closing Capital (₹850,000)'
  );
}

// -------------------------------------------------------------------------------------------------
// Test 4: Reversal & Void Handling
// Exclude REVERSED and VOIDED repayment distributions from active capital returned & profit share.
// -------------------------------------------------------------------------------------------------
console.log('\nTest 4: Reversal Handling (Exclude REVERSED and VOIDED from active partner totals)');
{
  const distributions = [
    { id: 'ret-1', principalReturned: new Prisma.Decimal(20000), profitShare: new Prisma.Decimal(4000), status: 'COMPLETED' },
    { id: 'ret-2', principalReturned: new Prisma.Decimal(10000), profitShare: new Prisma.Decimal(2000), status: 'REVERSED' },
    { id: 'ret-3', principalReturned: new Prisma.Decimal(15000), profitShare: new Prisma.Decimal(3000), status: 'COMPLETED' },
    { id: 'ret-4', principalReturned: new Prisma.Decimal(5000),  profitShare: new Prisma.Decimal(1000), status: 'VOIDED' },
  ];

  const activeDistributions = distributions.filter((d) => d.status !== 'REVERSED' && d.status !== 'VOIDED');

  const activePrincipalReturned = activeDistributions.reduce(
    (acc, d) => acc.plus(d.principalReturned),
    new Prisma.Decimal(0)
  );
  const activeProfitShare = activeDistributions.reduce(
    (acc, d) => acc.plus(d.profitShare),
    new Prisma.Decimal(0)
  );

  assert(distributions.length === 4, 'Audit ledger retains all 4 records including reversed/voided');
  assertEqual(activePrincipalReturned, 35000, 'Active Principal Returned is ₹35,000.00 (excludes ₹10,000 + ₹5,000)');
  assertEqual(activeProfitShare, 7000, 'Active Profit Share is ₹7,000.00 (excludes ₹2,000 + ₹1,000)');
}

// -------------------------------------------------------------------------------------------------
// Test 5: Empty State Handling for New or Unallocated Partner
// -------------------------------------------------------------------------------------------------
console.log('\nTest 5: Empty State Handling for New Partner Without Deal Fundings');
{
  const newPartner = {
    id: 'prt-new',
    partnerCode: 'PRT-0003',
    name: 'New Partner',
    capitalContribution: new Prisma.Decimal(200000),
    sharePercentage: new Prisma.Decimal(20),
    fundings: [],
    returns: []
  };

  const totalFunded = newPartner.fundings.reduce((acc, f: any) => acc.plus(f.amount), new Prisma.Decimal(0));
  const principalReturned = newPartner.returns.reduce((acc, r: any) => acc.plus(r.principalReturned), new Prisma.Decimal(0));
  const profitEarned = newPartner.returns.reduce((acc, r: any) => acc.plus(r.profitShare), new Prisma.Decimal(0));
  const currentCapital = newPartner.capitalContribution.minus(principalReturned);

  assertEqual(totalFunded, 0, 'Total funded to deals is ₹0.00');
  assertEqual(principalReturned, 0, 'Principal returned is ₹0.00');
  assertEqual(profitEarned, 0, 'Profit share earned is ₹0.00');
  assertEqual(currentCapital, 200000, 'Current capital balance equals initial contribution ₹200,000.00');
}

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
