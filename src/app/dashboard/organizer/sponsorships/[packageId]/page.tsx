"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DELIVERABLE_CATEGORIES } from "@/types/sponsorship";

export default function SponsorshipDeliverablesManager() {
  const { packageId } = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("social");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchPackage();
  }, [packageId]);

  async function fetchPackage() {
    try {
      const res = await fetch(`/api/sponsorship/packages?package_id=${packageId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.package) {
          setPkg(data.package);
          setDeliverables(data.package.sponsorship_deliverables || []);
        }
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  async function addDeliverable() {
    if (!category || !description.trim()) {
      toast.error("Description is required");
      return;
    }

    const categoryMeta = DELIVERABLE_CATEGORIES.find((c) => c.value === category);

    const res = await fetch("/api/sponsorship/deliverables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package_id: packageId,
        category,
        title: categoryMeta?.label || "Deliverable",
        description,
      }),
    });

    if (res.ok) {
      toast.success("Deliverable added");
      setDescription("");
      fetchPackage();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add deliverable");
    }
  }

  async function removeDeliverable(deliverableId: string) {
    const res = await fetch(`/api/sponsorship/deliverables?deliverable_id=${deliverableId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Deliverable removed");
      fetchPackage();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to remove deliverable");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-muted p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-bg-card rounded w-1/3" />
          <div className="h-40 bg-bg-card rounded" />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-bg-muted p-6">
        <div className="text-text-muted">Package not found</div>
      </div>
    );
  }

  const platformDefaults = deliverables.filter((d) => d.type === "platform_default");
  const organizerDeliverables = deliverables.filter((d) => d.type === "organizer_defined");

  return (
    <div className="min-h-screen bg-bg-muted p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Manage Deliverables</h1>
            <p className="text-text-secondary text-sm">{pkg.tier?.toUpperCase()} Package</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-bg-card border border-border-default rounded-lg text-text-secondary hover:text-text-primary"
          >
            Back
          </button>
        </div>

        <div className="bg-bg-card rounded-xl border border-border-default p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Platform Default Deliverables</h2>
          <div className="space-y-3">
            {platformDefaults.map((d) => (
              <div key={d.id} className="p-3 bg-bg-muted rounded-lg border border-border-default">
                <div className="text-sm font-semibold text-text-primary">{d.title}</div>
                <div className="text-xs text-text-secondary">{d.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card rounded-xl border border-border-default p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Organizer Deliverables</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              >
                {DELIVERABLE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                placeholder="Execution details"
              />
            </div>
            <button
              onClick={addDeliverable}
              className="bg-primary text-text-inverse px-4 py-2 rounded-lg hover:bg-primaryHover"
            >
              Add Deliverable
            </button>

            <div className="space-y-3">
              {organizerDeliverables.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-bg-muted rounded-lg border border-border-default">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{d.title}</div>
                    <div className="text-xs text-text-secondary">{d.description}</div>
                  </div>
                  <button
                    onClick={() => removeDeliverable(d.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {organizerDeliverables.length === 0 && (
                <div className="text-sm text-text-muted">No deliverables added yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
