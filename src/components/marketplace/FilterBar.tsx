"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cropCategories, contractStatuses } from "@/lib/mockContracts";

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  sortBy: string;
  onSort: (v: string) => void;
  total: number;
}

export default function FilterBar({
  search,
  onSearch,
  category,
  onCategory,
  status,
  onStatus,
  sortBy,
  onSort,
  total,
}: FilterBarProps) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between">
        {/* Left: search + filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search crops, farms…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-[#F2F4F3] focus:outline-none focus:border-[#1B5E55] focus:bg-white transition-colors w-52"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            {cropCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategory(cat)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                  category === cat
                    ? "bg-[#1B5E55] text-white border-[#1B5E55]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E55] hover:text-[#1B5E55]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Right: status + sort + count */}
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal size={15} className="text-gray-400" />

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-full px-4 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-[#1B5E55] cursor-pointer"
          >
            {contractStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-full px-4 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-[#1B5E55] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="delivery">Delivery Date</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="quantity">Largest Quantity</option>
          </select>

          {/* Result count */}
          <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
            {total} contract{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
