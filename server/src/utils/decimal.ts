import { Prisma } from '@prisma/client';

export type DecimalValue = Prisma.Decimal | string | number;

export const toDecimal = (value: DecimalValue | undefined | null): Prisma.Decimal => {
  if (value === undefined || value === null) return new Prisma.Decimal(0);
  return new Prisma.Decimal(value);
};

export const roundMoney = (value: DecimalValue): Prisma.Decimal => {
  return new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
};

export const roundMoneyString = (value: DecimalValue): string => {
  return roundMoney(value).toFixed(2);
};

export const calculatePercentage = (part: DecimalValue, total: DecimalValue): Prisma.Decimal => {
  const decTotal = new Prisma.Decimal(total);
  if (decTotal.isZero()) return new Prisma.Decimal(0);
  return new Prisma.Decimal(part).dividedBy(decTotal).times(100).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
};

export const calculateShareAmount = (total: DecimalValue, percentage: DecimalValue): Prisma.Decimal => {
  return new Prisma.Decimal(total).times(new Prisma.Decimal(percentage)).dividedBy(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
};

export const decimalMin = (a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal => {
  return a.lessThan(b) ? a : b;
};

export const decimalMax = (a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal => {
  return a.greaterThan(b) ? a : b;
};

export { Prisma };
