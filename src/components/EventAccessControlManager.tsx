// Component: Event Access Control Manager for Organizers
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Check } from "lucide-react";

interface AccessControlProps {
  eventId: string;
  organizerEmail: string;
}

type RestrictionType = "college" | "year_of_study" | "branch" | "club_membership";

interface Restriction {
  type: RestrictionType;
  value: string;
}

export function EventAccessControlManager({
  eventId,
  organizerEmail,
}: AccessControlProps) {
  const [accessType, setAccessType] = useState<"open" | "restricted">("open");
  const [requireAllCriteria, setRequireAllCriteria] = useState(false);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(false);

  const [newRestriction, setNewRestriction] = useState<Restriction>({
    type: "college",
    value: "",
  });

  const addRestriction = () => {
    if (!newRestriction.value.trim()) {
      toast.error("Please enter a value");
      return;
    }

    // Check for duplicates
    if (
      restrictions.some(
        (r) =>
          r.type === newRestriction.type && r.value === newRestriction.value
      )
    ) {
      toast.error("This restriction already exists");
      return;
    }

    setRestrictions([...restrictions, { ...newRestriction }]);
    setNewRestriction({ type: "college", value: "" });
  };

  const removeRestriction = (index: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (accessType === "restricted" && restrictions.length === 0) {
      toast.error("Please add at least one restriction");
      return;
    }

    setLoading(true);
    try {
      const restrictionsObj: any = {};

      // Group restrictions by type
      restrictions.forEach((restriction) => {
        if (!restrictionsObj[restriction.type]) {
          restrictionsObj[restriction.type] = [];
        }
        restrictionsObj[restriction.type].push(restriction.value);
      });

      restrictionsObj.require_all_criteria = requireAllCriteria;

      const response = await fetch("/api/access-control/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          organizerEmail,
          accessType,
          restrictions: restrictionsObj,
        }),
      });

      if (!response.ok) throw new Error("Failed to save access control");

      toast.success("Access control settings saved!");
    } catch (error) {
      console.error("Error saving access control:", error);
      toast.error("Failed to save access control");
    } finally {
      setLoading(false);
    }
  };

  const getRestrictionTypeLabel = (type: RestrictionType): string => {
    const labels: Record<RestrictionType, string> = {
      college: "College",
      year_of_study: "Year of Study",
      branch: "Branch",
      club_membership: "Club Membership",
    };
    return labels[type];
  };

  const getRestrictionPlaceholder = (type: RestrictionType): string => {
    const placeholders: Record<RestrictionType, string> = {
      college: "e.g., MIT Chennai, IIT Madras",
      year_of_study: "e.g., 3, 4",
      branch: "e.g., CSE, ECE, Mechanical",
      club_membership: "e.g., Tech Club, Science Club",
    };
    return placeholders[type];
  };

  return (
    <div className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-900">Event Access Control</h3>

      {/* Access Type Selection */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Who can register?</p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="accessType"
              value="open"
              checked={accessType === "open"}
              onChange={(e) => {
                setAccessType(e.target.value as "open" | "restricted");
                setRestrictions([]);
              }}
              className="w-4 h-4"
            />
            <span className="text-gray-700">
              Open for all (anyone can register)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="accessType"
              value="restricted"
              checked={accessType === "restricted"}
              onChange={(e) =>
                setAccessType(e.target.value as "open" | "restricted")
              }
              className="w-4 h-4"
            />
            <span className="text-gray-700">
              Restricted (only specific students can register)
            </span>
          </label>
        </div>
      </div>

      {/* Restrictions Section */}
      {accessType === "restricted" && (
        <div className="space-y-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Add eligibility criteria
            </p>
            <p className="text-xs text-gray-600">
              Students must match {requireAllCriteria ? "ALL" : "ANY"} of these
              criteria to register
            </p>
          </div>

          {/* Match Logic Selection */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!requireAllCriteria}
                onChange={() => setRequireAllCriteria(false)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Match ANY criteria</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={requireAllCriteria}
                onChange={() => setRequireAllCriteria(true)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Match ALL criteria</span>
            </label>
          </div>

          {/* Add Restriction Form */}
          <div className="space-y-3 pt-4 border-t border-purple-200">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newRestriction.type}
                onChange={(e) =>
                  setNewRestriction({
                    ...newRestriction,
                    type: e.target.value as RestrictionType,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="college">College</option>
                <option value="year_of_study">Year of Study</option>
                <option value="branch">Branch</option>
                <option value="club_membership">Club Membership</option>
              </select>

              <input
                type="text"
                placeholder={getRestrictionPlaceholder(newRestriction.type)}
                value={newRestriction.value}
                onChange={(e) =>
                  setNewRestriction({
                    ...newRestriction,
                    value: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={addRestriction}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-purple-300 text-purple-600 rounded-lg hover:bg-purple-100 transition"
            >
              <Plus className="w-4 h-4" />
              Add Restriction
            </button>
          </div>

          {/* Current Restrictions List */}
          {restrictions.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-purple-200">
              <p className="text-sm font-semibold text-gray-700">
                Current restrictions:
              </p>
              <div className="space-y-2">
                {restrictions.map((restriction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200"
                  >
                    <span className="text-sm text-gray-900">
                      <span className="font-medium">
                        {getRestrictionTypeLabel(restriction.type)}:
                      </span>{" "}
                      {restriction.value}
                    </span>
                    <button
                      onClick={() => removeRestriction(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
      >
        <Check className="w-4 h-4" />
        {loading ? "Saving..." : "Save Access Control Settings"}
      </button>

      {/* Info Box */}
      {accessType === "open" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✓ This event is <strong>open for all</strong> students. Anyone can
            register.
          </p>
        </div>
      )}

      {accessType === "restricted" && restrictions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ✓ Only students who match {requireAllCriteria ? "ALL" : "ANY"} of
            the {restrictions.length} restriction{restrictions.length > 1 ? "s" : ""}{" "}
            can register for this event.
          </p>
        </div>
      )}
    </div>
  );
}
