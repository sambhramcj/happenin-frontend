"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

interface Category {
  name: string;
  count: number;
}

interface CategoryStripProps {
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
}

export default function CategoryStrip({
  onCategoryChange,
  selectedCategory,
}: CategoryStripProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/home/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="px-4 py-2 bg-gray-100 rounded-full min-w-[100px] h-10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Filter className="w-4 h-4" />
        <span>Filter by Category</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* All Categories */}
        <button
          onClick={() => onCategoryChange("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === "all"
              ? "bg-blue-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Events
        </button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onCategoryChange(category.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedCategory === category.name
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.name}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === category.name
                  ? "bg-blue-400"
                  : "bg-gray-200"
              }`}
            >
              {category.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
