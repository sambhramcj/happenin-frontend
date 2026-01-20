// HAPPENIN — ZOD VALIDATION SCHEMAS
// Production-grade validation for all forms

import { z } from "zod";

// Event Creation Schema
export const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  date: z.string().min(1, "Event date is required"),
  location: z.string().min(3, "Location must be at least 3 characters").max(200, "Location must be less than 200 characters"),
  price: z.string().regex(/^\d+$/, "Price must be a valid number").refine((val) => parseInt(val) >= 0, "Price must be positive"),
  banner_image: z.string().optional(),
  discount_enabled: z.boolean().optional(),
  discount_club: z.string().optional(),
  discount_amount: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;

// Student Profile Schema
export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  college: z.string().min(2, "College name required").max(200, "College name too long"),
  profile_photo: z.string().url().optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Club Membership Schema
export const membershipSchema = z.object({
  club: z.string().min(2, "Club name required").max(100, "Club name too long"),
  memberId: z.string().min(3, "Member ID required").max(50, "Member ID too long"),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration Schema (for event registration metadata)
export const registrationMetadataSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  finalPrice: z.number().min(0, "Price must be positive"),
  discountApplied: z.boolean().optional(),
  membershipUsed: z.string().optional(),
});

export type RegistrationMetadata = z.infer<typeof registrationMetadataSchema>;
