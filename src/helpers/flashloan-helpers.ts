import {
  ASSET_RESOLUTION,
  StarkwareOrderSide,
  SyntheticAsset,
  FLASH1_CONTRACT_SIZE,
  REVERSE_SYNTHETIC_ASSET_MAP,
} from '@flash1-exchange/starkex-lib';

export const getFlashloanPriceWithInterest = (flashloan: number): string => {
  const r = Math.pow(10, ASSET_RESOLUTION.USDT);
  return `${Math.round(flashloan * 1.000001 * r) / r}`;
};

export const getClosingOrderCollateralAmount = (
  openingOrderSide: StarkwareOrderSide,
  quantumsAmountCollateral: string
): string => {
  const original = BigInt(quantumsAmountCollateral);
  const adjustment = (original / BigInt(10)) * BigInt(2); // 20% adjustment with truncate (calculation order cannot be changed)
  return openingOrderSide === StarkwareOrderSide.BUY
    ? `${original - adjustment}`
    : `${original + adjustment}`;
};

export const getClosingOrderPrice = (
  side: StarkwareOrderSide,
  price: string
): string => {
  const margin = 0.2;
  return side === StarkwareOrderSide.BUY
    ? `${parseFloat(price) * (1 - margin)}`
    : `${parseFloat(price) * (1 + margin)}`;
};

export const getHumanReadableQuantityForFlashLoan = (
  asset: SyntheticAsset,
  flashloan: number,
  leverage: number,
  price: string
): string => {
  const r = Math.pow(10, ASSET_RESOLUTION[asset]);
  const totalPositionSize = flashloan * leverage;
  const roundedHumanReadableQuantity =
    Math.round((totalPositionSize / parseFloat(price)) * r) / r;
  return getFlash1QuantizedQuantity(
    asset,
    roundedHumanReadableQuantity.toFixed(ASSET_RESOLUTION[asset])
  );
};

export const getHumanReadableQuantity = (
  asset: SyntheticAsset,
  userCollateral: number,
  leverage: number,
  price: string
): string => {
  const r = Math.pow(10, ASSET_RESOLUTION[asset]);
  const totalPositionSize = userCollateral * leverage;
  const roundedHumanReadableQuantity =
    Math.round((totalPositionSize / parseFloat(price)) * r) / r;
  return getFlash1QuantizedQuantity(
    asset,
    roundedHumanReadableQuantity.toFixed(ASSET_RESOLUTION[asset])
  );
};

export const getFlash1QuantizedQuantity = (
  asset: SyntheticAsset,
  quantity: string
): string => {
  const contractSize = FLASH1_CONTRACT_SIZE[REVERSE_SYNTHETIC_ASSET_MAP[asset]];
  const contractResolution = -Math.log10(contractSize);
  const internallyQuantized = Math.floor(parseFloat(quantity) / contractSize);
  return (internallyQuantized * contractSize).toFixed(contractResolution);
};

export const getInsurancePremium = (flashloan: number): string => {
  const r = Math.pow(10, ASSET_RESOLUTION.USDT);
  return `${Math.round(flashloan * 0.0003 * r) / r}`;
};

export const getClosingOrderSuffix = (clientId: string): string => {
  return clientId + '-CLOSING';
};

export const getFlashLoanReturnTransferSuffix = (clientId: string): string => {
  return clientId + '-LOAN-RETURN';
};

export const getInsurancePremiumTransferSuffix = (clientId: string): string => {
  return clientId + '-INSURANCE-FEE';
};
