import { CropContract } from "@/types/contract";
import { mockContracts } from "./mockContracts";

export interface OwnedContract {
  contract: CropContract;
  purchasedAt: string;
  paidUsdc: number;
  deliveryAddress?: string;
}

// Mock: buyer owns these 5 contracts (paidUsdc = full contract value, 1 buyer per contract)
export const mockPortfolio: OwnedContract[] = [
  {
    contract: mockContracts[0], // Heritage Red Fife Wheat — available
    purchasedAt: "2026-03-02",
    paidUsdc: 925,
  },
  {
    contract: mockContracts[1], // Purple Barley — sold
    purchasedAt: "2026-02-22",
    paidUsdc: 720,
  },
  {
    contract: mockContracts[3], // Emmer Farro — redeemable
    purchasedAt: "2026-01-20",
    paidUsdc: 1240,
  },
  {
    contract: mockContracts[4], // Black Garlic — available
    purchasedAt: "2026-03-09",
    paidUsdc: 1760,
  },
  {
    contract: mockContracts[6], // Persian Saffron — redeemed
    purchasedAt: "2025-11-05",
    paidUsdc: 6400,
    deliveryAddress: "42 Rue des Martyrs, Paris, 75009, FR",
  },
];
