export type ContractStatus = "open" | "funded" | "redeemable" | "redeemed";

export type CropCategory =
  | "grain"
  | "vegetable"
  | "herb"
  | "fruit"
  | "legume"
  | "specialty";

export interface CropContract {
  id: string;
  tokenId: number;
  cropName: string;
  cropCategory: CropCategory;
  farmName: string;
  farmerName: string;
  region: string;
  state: string;
  country: string;
  harvestDate: string;
  deliveryDate: string;
  quantityKg: number;
  pricePerKgUsdc: number;
  totalValueUsdc: number;
  fundedAmountUsdc: number;
  status: ContractStatus;
  description: string;
  gradingStandard: string;
  placeholderGradient: string; // Tailwind gradient classes
  mintedAt: string;
  contractAddress?: string;
}
