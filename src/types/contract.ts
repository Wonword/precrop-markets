export type ContractStatus = "available" | "sold" | "redeemable" | "redeemed";

export type CropCategory =
  | "grain"
  | "vegetable"
  | "herb"
  | "fruit"
  | "legume"
  | "specialty";

export interface QualityStandards {
  moisture?: string;        // e.g. "<14%"
  totalDefects?: string;    // e.g. "<2%"
  totalDamaged?: string;    // e.g. "<2%"
  foreignMaterial?: string; // e.g. "<0.5%"
  contrasting?: string;     // e.g. "<1%"
  testWeight?: string;      // e.g. ">55 lbs."
  specialMetrics?: string;  // free text
}

export interface CropContract {
  id: string;
  tokenId: number;
  cropName: string;
  cropCategory: CropCategory;
  farmName: string;
  farmerName: string;
  farmerEmail?: string;
  farmerPhone?: string;
  region: string;
  state: string;
  country: string;
  harvestDate?: string;
  deliveryDate: string;
  deliveryMethod?: string;   // e.g. "Buyer Provided"
  deliveryLocation?: string; // e.g. "Pick-up at Seller's Location"
  quantityUnits: number;
  unitType: string;          // e.g. "Tote Bag", "kg", "lbs", "Bushel"
  unitSizeLbs?: number;      // e.g. 2000 for Tote Bag
  pricePerUnitUsdc: number;
  totalValueUsdc: number;
  gradingStandard?: string;  // e.g. "USDA Organic", "US No. 1"
  qualityStandards?: QualityStandards;
  dockage?: string;
  notes?: string;
  status: ContractStatus;
  description: string;
  placeholderGradient: string;
  mintedAt: string;
  contractAddress?: string;
  imageUrl?: string;
}
