type DbClient = any;

export type StudentEligibilityContext = {
  college: string | null;
  yearOfStudy: number | null;
  branch: string | null;
  clubs: string[];
  memberships: Array<{ club: string; memberId: string }>;
};

type EventPricingConfig = {
  price: number | string;
  discount_enabled?: boolean;
  discount_club?: string | null;
  discount_amount?: number | null;
  eligible_members?: Array<Record<string, any>> | null;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function parseYearOfStudy(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
}

function extractEligibleMemberIds(eligibleMembers: Array<Record<string, any>> | null | undefined) {
  const ids = new Set<string>();
  for (const member of eligibleMembers || []) {
    const raw = member?.memberId ?? member?.member_id ?? member?.id ?? null;
    if (raw !== null && raw !== undefined) {
      ids.add(String(raw).trim());
    }
  }
  return ids;
}

export async function getStudentEligibilityContext(
  db: DbClient,
  studentEmail: string
): Promise<StudentEligibilityContext> {
  const { data: profile } = await db
    .from("student_profiles")
    .select("*")
    .eq("student_email", studentEmail)
    .maybeSingle();

  const { data: memberships } = await db
    .from("memberships")
    .select("club,member_id")
    .eq("student_email", studentEmail);

  const normalizedMemberships = (memberships || [])
    .filter((membership: any) => membership?.club && membership?.member_id)
    .map((membership: any) => ({
      club: String(membership.club),
      memberId: String(membership.member_id),
    }));

  return {
    college: profile?.college_name || null,
    yearOfStudy: parseYearOfStudy(profile?.year_of_study),
    branch: profile?.branch || null,
    clubs: normalizedMemberships.map((membership: any) => membership.club),
    memberships: normalizedMemberships,
  };
}

export async function isStudentEligibleForEvent(
  db: DbClient,
  eventId: string,
  studentEmail: string,
  context?: StudentEligibilityContext
): Promise<boolean> {
  const derivedContext = context || (await getStudentEligibilityContext(db, studentEmail));

  const { data, error } = await db.rpc("is_user_eligible_for_event", {
    p_event_id: eventId,
    p_user_email: studentEmail,
    p_user_college: derivedContext.college,
    p_user_year_of_study: derivedContext.yearOfStudy,
    p_user_branch: derivedContext.branch,
    p_user_club_memberships:
      derivedContext.clubs.length > 0 ? derivedContext.clubs : null,
  });

  if (error) {
    throw new Error(error.message || "Failed to evaluate event eligibility");
  }

  return Boolean(data);
}

export function calculateStudentEventPrice(
  event: EventPricingConfig,
  context: StudentEligibilityContext
): number {
  const basePrice = Math.max(0, Number(event.price || 0));
  if (!event.discount_enabled || !event.discount_club) {
    return basePrice;
  }

  const membership = context.memberships.find(
    (item) => normalizeText(item.club) === normalizeText(event.discount_club)
  );
  if (!membership) {
    return basePrice;
  }

  const eligibleMemberIds = extractEligibleMemberIds(event.eligible_members || []);
  if (!eligibleMemberIds.has(membership.memberId)) {
    return basePrice;
  }

  return Math.max(0, basePrice - Math.max(0, Number(event.discount_amount || 0)));
}