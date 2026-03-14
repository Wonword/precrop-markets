import { CropContract } from "@/types/contract";
import { mockContracts } from "./mockContracts";

export interface OwnedContract {
  contract: CropContract;
  purchasedAt: string;
  paidUsdc: number;
  deliveryAddress?: string;
}

// Mock: buyer owns these 5 contracts
export const mockPortfolio: OwnedContract[] = [
  {
    contract: mockContracts[0], // Heritage Red Fife Wheat — open
    purchasedAt: "2026-03-02",
    paidUsdc: 370,
  },
  {
    contract: mockContracts[1], // Purple Barley — funded
    purchasedAt: "2026-02-22",
    paidUsdc: 720,
  },
  {
    contract: mockContracts[3], // Emmer Farro — redeemable
    purchasedAt: "2026-01-20",
    paidUsdc: 1240,
  },
  {
    contract: mockContracts[4], // Black Garlic — open
    purchasedAt: "2026-03-09",
    paidUsdc: 528,
  },
  {
    contract: mockContracts[6], // Persian Saffron — redeemed
    purchasedAt: "2025-11-05",
    paidUsdc: 6400,
    deliveryAddress: "42 Rue des Martyrs, Paris, 75009, FR",
  },
];
