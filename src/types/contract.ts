export type ContractStatus = "available" | "sold" | "redeemable" | "redeemed";

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
  status: ContractStatus;
  description: string;
  gradingStandard: string;
  placeholderGradient: string;
  mintedAt: string;
  contractAddress?: string;
  imageUrl?: string;
}
