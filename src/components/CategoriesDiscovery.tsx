"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface Category {
  id: string;
  category_name: string;
  description: string | null;
  color_code: string;
  icon_url: string | null;
  display_order: number;
}

interface CategoriesDiscoveryProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategories?: string[];
  showDescription?: boolean;
}

export function CategoriesDiscovery({
  onCategorySelect,
  selectedCategories = [],
  showDescription = true,
}: CategoriesDiscoveryProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedCategories)
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelected(newSelected);
    onCategorySelect?.(categoryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <Icons.Loader2 className="w-6 h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategoryToggle(category.id)}
            className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
              selected.has(category.id)
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
            style={{
              backgroundColor: selected.has(category.id)
                ? `${category.color_code}20`
                : undefined,
              borderColor: selected.has(category.id)
                ? category.color_code
                : undefined,
            }}
          >
            {/* Checkmark for selected */}
            {selected.has(category.id) && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: category.color_code }}
              >
                <Icons.Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Category Icon/Badge */}
            <div
              className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: category.color_code }}
            >
              {category.icon_url ? (
                <img
                  src={category.icon_url}
                  alt={category.category_name}
                  className="w-6 h-6"
                />
              ) : (
                <Icons.Tag className="w-5 h-5" />
              )}
            </div>

            {/* Category Name */}
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {category.category_name}
            </h3>

            {/* Description */}
            {showDescription && category.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Icons.AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No categories available</p>
        </div>
      )}
    </div>
  );
}
