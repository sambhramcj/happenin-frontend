/**
 * Notification Service
 * Handles creating in-app notifications for all user roles
 * (Student, Organizer, Admin, Sponsor)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface NotificationParams {
  recipientEmail: string;
  recipientRole: "student" | "organizer" | "sponsor" | "admin";
  title: string;
  body: string;
  actionUrl?: string;
  notificationType:
    | "registration"
    | "payment"
    | "reminder"
    | "update"
    | "certificate"
    | "volunteer"
    | "sponsorship"
    | "admin_alert";
  eventId?: string;
  data?: Record<string, any>;
  iconType?: string;
}

/**
 * Create an in-app notification (immediately visible to user)
 * Works for: Student, Organizer, Sponsor, Admin
 */
export async function createInAppNotification(
  params: NotificationParams
) {
  try {
    const { data, error } = await db
      .from("in_app_notifications")
      .insert([
        {
          recipient_email: params.recipientEmail,
          recipient_role: params.recipientRole,
          title: params.title,
          body: params.body,
          action_url: params.actionUrl || null,
          notification_type: params.notificationType,
          event_id: params.eventId || null,
          icon_type: params.iconType || null,
          data: params.data || null,
          is_read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating in-app notification:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error creating notification:", err);
    return null;
  }
}

/**
 * Notification Triggers for Different User Roles
 */

/**
 * Student Registration Notification
 * Triggered when: Student registers for event (paid or free)
 */
export async function notifyStudentRegistration(
  studentEmail: string,
  eventId: string,
  eventTitle: string,
  registrationType: "individual" | "team"
) {
  await createInAppNotification({
    recipientEmail: studentEmail,
    recipientRole: "student",
    title: "Registration Confirmed",
    body:
      registrationType === "individual"
        ? `You're registered for "${eventTitle}". Check your email for details.`
        : `Your team is registered for "${eventTitle}". You'll receive the team link via email.`,
    actionUrl: `/events/${eventId}`,
    notificationType: "registration",
    eventId,
    iconType: "registration",
    data: { registrationType },
  });
}

/**
 * Organizer Registration Notification
 * Triggered when: Someone registers for organizer's event
 */
export async function notifyOrganizerNewRegistration(
  organizerEmail: string,
  eventId: string,
  eventTitle: string,
  studentName: string,
  studentEmail: string,
  registrationType: "individual" | "team",
  teamSize?: number
) {
  await createInAppNotification({
    recipientEmail: organizerEmail,
    recipientRole: "organizer",
    title: "New Registration",
    body:
      registrationType === "individual"
        ? `${studentName} (${studentEmail}) registered for "${eventTitle}"`
        : `${studentName}'s team (${teamSize} members) registered for "${eventTitle}"`,
    actionUrl: `/organizer/dashboard/${eventId}/registrations`,
    notificationType: "registration",
    eventId,
    iconType: "registration",
    data: { studentEmail, studentName, registrationType, teamSize },
  });
}

/**
 * Payment Confirmation Notification
 * Triggered for: Student (after successful payment)
 */
export async function notifyStudentPaymentSuccess(
  studentEmail: string,
  eventId: string,
  eventTitle: string,
  amount: number
) {
  await createInAppNotification({
    recipientEmail: studentEmail,
    recipientRole: "student",
    title: "Payment Successful",
    body: `Payment of ₹${amount} for "${eventTitle}" confirmed. Your registration is active.`,
    actionUrl: `/events/${eventId}`,
    notificationType: "payment",
    eventId,
    iconType: "payment",
    data: { amount, status: "success" },
  });
}

/**
 * Organizer Payment Notification
 * Triggered for: Organizer (when someone registers with payment)
 */
export async function notifyOrganizerPaymentReceived(
  organizerEmail: string,
  eventId: string,
  eventTitle: string,
  studentName: string,
  amount: number
) {
  await createInAppNotification({
    recipientEmail: organizerEmail,
    recipientRole: "organizer",
    title: "Payment Received",
    body: `${studentName} paid ₹${amount} for "${eventTitle}"`,
    actionUrl: `/organizer/dashboard/${eventId}/payments`,
    notificationType: "payment",
    eventId,
    iconType: "payment",
    data: { amount, studentName },
  });
}

/**
 * Event Update Notification
 * Triggered for: Students, Organizers (event status change)
 */
export async function notifyEventUpdate(
  eventId: string,
  eventTitle: string,
  updateType: "reschedule" | "cancel" | "details_change",
  updateDetails: string,
  affectedEmails: { student: string[]; organizer: string[] }
) {
  const title =
    updateType === "cancel"
      ? "Event Cancelled"
      : updateType === "reschedule"
        ? "Event Rescheduled"
        : "Event Updated";

  // Notify students
  for (const studentEmail of affectedEmails.student) {
    await createInAppNotification({
      recipientEmail: studentEmail,
      recipientRole: "student",
      title,
      body: `"${eventTitle}" has been ${updateType === "cancel" ? "cancelled" : "updated"}. ${updateDetails}`,
      actionUrl: `/events/${eventId}`,
      notificationType: "update",
      eventId,
      iconType: "update",
      data: { updateType, updateDetails },
    });
  }

  // Notify organizers
  for (const organizerEmail of affectedEmails.organizer) {
    await createInAppNotification({
      recipientEmail: organizerEmail,
      recipientRole: "organizer",
      title: "Your Event " + title,
      body: updateDetails,
      actionUrl: `/organizer/dashboard/${eventId}`,
      notificationType: "update",
      eventId,
      iconType: "update",
      data: { updateType, updateDetails },
    });
  }
}

/**
 * Certificate Issued Notification
 * Triggered for: Student (when certificate is generated)
 */
export async function notifyStudentCertificateIssued(
  studentEmail: string,
  eventId: string,
  eventTitle: string,
  certificateUrl: string
) {
  await createInAppNotification({
    recipientEmail: studentEmail,
    recipientRole: "student",
    title: "Certificate Issued",
    body: `Your certificate for "${eventTitle}" is ready!`,
    actionUrl: certificateUrl || `/certificates`,
    notificationType: "certificate",
    eventId,
    iconType: "certificate",
    data: { certificateUrl },
  });
}

/**
 * Volunteer Application Notification
 * Triggered for: Organizer (new volunteer application)
 */
export async function notifyOrganizerVolunteerApplication(
  organizerEmail: string,
  eventId: string,
  eventTitle: string,
  volunteerName: string,
  volunteerEmail: string,
  role: string
) {
  await createInAppNotification({
    recipientEmail: organizerEmail,
    recipientRole: "organizer",
    title: "New Volunteer Application",
    body: `${volunteerName} applied as ${role} for "${eventTitle}"`,
    actionUrl: `/organizer/dashboard/${eventId}/volunteers`,
    notificationType: "volunteer",
    eventId,
    iconType: "volunteer",
    data: { volunteerEmail, volunteerName, role },
  });
}

/**
 * Sponsorship Notification
 * Triggered for: Organizer (new sponsorship signed), Sponsor (confirmation)
 */
export async function notifyOrganizerNewSponsor(
  organizerEmail: string,
  eventId: string,
  eventTitle: string,
  sponsorName: string,
  sponsorAmount: number,
  tier: string
) {
  await createInAppNotification({
    recipientEmail: organizerEmail,
    recipientRole: "organizer",
    title: "New Sponsorship Confirmed",
    body: `${sponsorName} (${tier.toUpperCase()}) sponsored ₹${sponsorAmount} for "${eventTitle}"`,
    actionUrl: `/organizer/dashboard/${eventId}/sponsorships`,
    notificationType: "sponsorship",
    eventId,
    iconType: "sponsorship",
    data: { sponsorName, sponsorAmount, tier },
  });
}

export async function notifySponsorshipConfirmation(
  sponsorEmail: string,
  eventId: string,
  eventTitle: string,
  amount: number,
  tier: string
) {
  await createInAppNotification({
    recipientEmail: sponsorEmail,
    recipientRole: "sponsor",
    title: "Sponsorship Confirmed",
    body: `Your ${tier.toUpperCase()} sponsorship (₹${amount}) for "${eventTitle}" is confirmed.`,
    actionUrl: `/events/${eventId}`,
    notificationType: "sponsorship",
    eventId,
    iconType: "sponsorship",
    data: { amount, tier },
  });
}

/**
 * Admin Alert Notification
 * Triggered for: Admin (system alerts, suspicious activity, capacity issues)
 */
export async function notifyAdminAlert(
  adminEmail: string,
  alertType: string,
  title: string,
  message: string,
  eventId?: string,
  data?: Record<string, any>
) {
  await createInAppNotification({
    recipientEmail: adminEmail,
    recipientRole: "admin",
    title,
    body: message,
    actionUrl: eventId ? `/admin/events/${eventId}` : `/admin/dashboard`,
    notificationType: "admin_alert",
    eventId,
    iconType: alertType,
    data: { alertType, ...data },
  });
}

/**
 * Capacity Alert Notification
 * Triggered for: Organizer (event reaching capacity)
 */
export async function notifyOrganizerCapacityAlert(
  organizerEmail: string,
  eventId: string,
  eventTitle: string,
  currentRegistrations: number,
  maxCapacity: number
) {
  const percentFull = Math.round((currentRegistrations / maxCapacity) * 100);
  let message = `"${eventTitle}" is ${percentFull}% full (${currentRegistrations}/${maxCapacity} registrations)`;

  if (percentFull >= 100) {
    message = `"${eventTitle}" has reached maximum capacity!`;
  } else if (percentFull >= 90) {
    message = `"${eventTitle}" is almost full (${percentFull}%)`;
  }

  await createInAppNotification({
    recipientEmail: organizerEmail,
    recipientRole: "organizer",
    title:
      percentFull >= 100 ? "Event At Capacity" : "Capacity Alert",
    body: message,
    actionUrl: `/organizer/dashboard/${eventId}`,
    notificationType: "admin_alert",
    eventId,
    iconType: "capacity",
    data: { currentRegistrations, maxCapacity, percentFull },
  });
}
