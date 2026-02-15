"use client";

import { useState } from "react";
import { X, Users, User } from "lucide-react";

interface TeamMember {
  email: string;
  full_name: string;
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    price: number;
  };
  onRegister: (mode: "individual" | "team", teamData?: { size: number; members: TeamMember[] }) => void;
}

export function RegistrationModal({ isOpen, onClose, event, onRegister }: RegistrationModalProps) {
  const [mode, setMode] = useState<"select" | "individual" | "team">("select");
  const [teamSize, setTeamSize] = useState<number>(2);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { email: "", full_name: "" },
    { email: "", full_name: "" },
  ]);

  if (!isOpen) return null;

  const handleModeSelect = (selectedMode: "individual" | "team") => {
    if (selectedMode === "individual") {
      onRegister("individual");
      onClose();
    } else {
      setMode("team");
    }
  };

  const handleTeamSizeChange = (size: number) => {
    setTeamSize(size);
    const newMembers = Array.from({ length: size }, (_, i) => 
      teamMembers[i] || { email: "", full_name: "" }
    );
    setTeamMembers(newMembers);
  };

  const handleTeamMemberChange = (index: number, field: "email" | "full_name", value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const handleTeamSubmit = () => {
    // Validation
    const allFilled = teamMembers.every(m => m.email.trim() && m.full_name.trim());
    if (!allFilled) {
      alert("Please fill all team member details");
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = teamMembers.every(m => emailRegex.test(m.email));
    if (!validEmails) {
      alert("Please enter valid email addresses");
      return;
    }

    onRegister("team", { size: teamSize, members: teamMembers });
    onClose();
  };

  const totalPrice = event.price * (mode === "team" ? teamSize : 1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register for Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Event Info */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{event.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Price: ₹{event.price} per person
            </p>
          </div>

          {/* Mode Selection */}
          {mode === "select" && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose your registration type:
              </p>

              <button
                onClick={() => handleModeSelect("individual")}
                className="w-full p-6 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 rounded-xl transition-all flex items-start gap-4 text-left"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    Individual Registration
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Register only yourself for this event
                  </p>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-2">
                    ₹{event.price}
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleModeSelect("team")}
                className="w-full p-6 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 rounded-xl transition-all flex items-start gap-4 text-left"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    Team Registration (Bulk)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Register multiple people at once - one person pays for the whole team
                  </p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2">
                    From ₹{event.price * 2} (min. 2 members)
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Team Registration Form */}
          {mode === "team" && (
            <div className="space-y-6">
              {/* Team Size Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team Size
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => handleTeamSizeChange(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={2}>2 members</option>
                  <option value={3}>3 members</option>
                  <option value={4}>4 members</option>
                  <option value={5}>5 members</option>
                  <option value={6}>6 members</option>
                  <option value={7}>7 members</option>
                  <option value={8}>8 members</option>
                  <option value={9}>9 members</option>
                  <option value={10}>10 members</option>
                </select>
              </div>

              {/* Team Members */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Team Members</h4>
                {teamMembers.map((member, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {index === 0 ? "Team Lead (You)" : `Member ${index + 1}`}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleTeamMemberChange(index, "email", e.target.value)}
                        placeholder={index === 0 ? "your@email.com" : "member@email.com"}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={member.full_name}
                        onChange={(e) => handleTeamMemberChange(index, "full_name", e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Price */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {teamSize} members × ₹{event.price}
                  </span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{totalPrice}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  You will pay for the entire team. Tickets will be sent to all members.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("select")}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleTeamSubmit}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
