// Component: Bulk Ticket Manager for Organizers
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface BulkTicketPack {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  base_price: number;
  bulk_price: number;
  discount_percentage: number;
  total_cost: number;
  offer_title?: string;
  offer_expiry_date?: string;
  status: string;
  sold_count: number;
  available_count: number;
}

interface BulkTicketManagerProps {
  eventId: string;
  organizerEmail: string;
  onPackCreated?: () => void;
}

export function BulkTicketManager({
  eventId,
  organizerEmail,
  onPackCreated,
}: BulkTicketManagerProps) {
  const [packs, setPacks] = useState<BulkTicketPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPack, setEditingPack] = useState<BulkTicketPack | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: 10,
    basePrice: 0,
    bulkPrice: 0,
    offerTitle: "",
    offerDescription: "",
    offerExpiryDate: "",
  });

  // Fetch bulk packs for this event
  const fetchPacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/bulk-tickets/packs?eventId=${eventId}`
      );
      if (!response.ok) throw new Error("Failed to fetch packs");
      const data = await response.json();
      setPacks(data);
    } catch (error) {
      console.error("Error fetching packs:", error);
      toast.error("Failed to load bulk ticket packs");
    } finally {
      setLoading(false);
    }
  };

  // Create or update bulk pack
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quantity <= 0 || formData.basePrice <= 0 || formData.bulkPrice <= 0) {
      toast.error("Please enter valid values");
      return;
    }

    if (formData.bulkPrice > formData.basePrice) {
      toast.error("Bulk price cannot be higher than base price");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bulk-tickets/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          organizerEmail,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to create bulk pack");

      toast.success("Bulk ticket pack created successfully!");
      setFormData({
        name: "",
        description: "",
        quantity: 10,
        basePrice: 0,
        bulkPrice: 0,
        offerTitle: "",
        offerDescription: "",
        offerExpiryDate: "",
      });
      setShowForm(false);
      fetchPacks();
      onPackCreated?.();
    } catch (error) {
      console.error("Error creating pack:", error);
      toast.error("Failed to create bulk ticket pack");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (packId: string) => {
    if (!confirm("Are you sure you want to delete this bulk pack?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/bulk-tickets/packs/${packId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete pack");

      toast.success("Bulk pack deleted");
      fetchPacks();
    } catch (error) {
      console.error("Error deleting pack:", error);
      toast.error("Failed to delete bulk pack");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Bulk Ticket Packs</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingPack(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Bulk Pack
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Pack name (e.g., Group of 10)"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) })
              }
              min="1"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Base price per ticket"
              value={formData.basePrice}
              onChange={(e) =>
                setFormData({ ...formData, basePrice: parseFloat(e.target.value) })
              }
              step="0.01"
              min="0"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              placeholder="Bulk price per ticket"
              value={formData.bulkPrice}
              onChange={(e) =>
                setFormData({ ...formData, bulkPrice: parseFloat(e.target.value) })
              }
              step="0.01"
              min="0"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Offer Fields */}
          <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-900">Offer Details (Optional)</h4>
            <input
              type="text"
              placeholder="Offer title (e.g., 'Early Bird 20% Off')"
              value={formData.offerTitle}
              onChange={(e) =>
                setFormData({ ...formData, offerTitle: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              placeholder="Offer description"
              value={formData.offerDescription}
              onChange={(e) =>
                setFormData({ ...formData, offerDescription: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
            />
            <input
              type="datetime-local"
              placeholder="Offer expiry date"
              value={formData.offerExpiryDate}
              onChange={(e) =>
                setFormData({ ...formData, offerExpiryDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading ? "Creating..." : "Create Bulk Pack"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingPack(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bulk Packs List */}
      <div className="space-y-3">
        {packs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No bulk ticket packs yet. Create one to get started!</p>
          </div>
        ) : (
          packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-white border border-gray-200 rounded-lg p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{pack.name}</h4>
                  {pack.description && (
                    <p className="text-sm text-gray-600 mt-1">{pack.description}</p>
                  )}
                  {pack.offer_title && (
                    <p className="text-sm font-semibold text-purple-600 mt-1">
                      🎉 {pack.offer_title}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pack.status === "active"
                      ? "bg-green-100 text-green-700"
                      : pack.status === "sold_out"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {pack.status.charAt(0).toUpperCase() + pack.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{pack.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Discount</p>
                  <p className="font-semibold text-green-600">
                    {pack.discount_percentage}% off
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Available</p>
                  <p className="font-semibold text-gray-900">
                    {pack.available_count} / {pack.quantity}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pack.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
