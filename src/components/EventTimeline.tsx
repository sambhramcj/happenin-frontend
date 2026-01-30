"use client";

import { Icons } from "@/components/icons";

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  type?: "registration" | "opening" | "session" | "break" | "closing";
}

interface EventTimelineProps {
  items: TimelineItem[];
  isEditable?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EventTimeline({
  items,
  isEditable = false,
  onAdd,
  onEdit,
  onDelete,
}: EventTimelineProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case "registration":
        return <Icons.Users className="h-5 w-5 text-blue-500" />;
      case "opening":
        return <Icons.Flame className="h-5 w-5 text-orange-500" />;
      case "session":
        return <Icons.Clipboard className="h-5 w-5 text-purple-500" />;
      case "break":
        return <Icons.Clock className="h-5 w-5 text-yellow-500" />;
      case "closing":
        return <Icons.X className="h-5 w-5 text-red-500" />;
      default:
        return <Icons.Calendar className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "registration":
        return "bg-blue-500/10 border-blue-500/30";
      case "opening":
        return "bg-orange-500/10 border-orange-500/30";
      case "session":
        return "bg-purple-500/10 border-purple-500/30";
      case "break":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "closing":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-primary/10 border-primary/30";
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-bg-card to-bg-muted rounded-xl p-8 border-2 border-dashed border-border-default text-center">
        <Icons.Calendar className="h-12 w-12 text-text-muted opacity-50 mx-auto mb-3" />
        <p className="text-text-muted mb-4">No timeline items yet</p>
        {isEditable && onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-all"
          >
            Add Timeline Item
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isEditable && onAdd && (
        <button
          onClick={onAdd}
          className="w-full px-4 py-2 border-2 border-dashed border-border-default rounded-lg text-text-secondary hover:border-primary hover:text-primary transition-all font-medium"
        >
          + Add Timeline Item
        </button>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/10"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="relative pl-20">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-12 h-12 flex items-center justify-center">
                <div className="absolute w-12 h-12 bg-bg-card rounded-full border-4 border-primary flex items-center justify-center">
                  {getIcon(item.type)}
                </div>
              </div>

              {/* Item content */}
              <div className={`rounded-xl p-4 border-2 ${getTypeColor(item.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text-primary">{item.time}</span>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-semibold">
                        {item.type || "Event"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-text-secondary">{item.description}</p>
                    )}
                  </div>

                  {isEditable && (
                    <div className="flex gap-2 ml-4">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item.id)}
                          className="p-2 hover:bg-bg-muted rounded-lg transition-all"
                          title="Edit"
                        >
                          <Icons.Upload className="h-4 w-4 text-text-secondary" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Icons.X className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
