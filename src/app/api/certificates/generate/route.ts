/**
 * Server-side Certificate Generation API
 * POST /api/certificates/generate
 * 
 * STRICT RULES:
 * - Server-side only (never expose to client)
 * - Only customizes participant NAME
 * - Uses pre-uploaded certificate template
 * - Embeds Google Fonts into PDF
 * - GATED: Requires sponsorship settlement (if event has sponsorships)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateCertificate, validateCertificateConfig } from "@/lib/pdf-utils";
import { isSponsorshipSettled, sponsorshipNotSettledError } from "@/lib/sponsorshipAccess";

export const runtime = "nodejs"; // Ensure Node.js runtime for pdf-lib
export const dynamic = "force-dynamic";

interface GenerateRequest {
  eventId: string;
  studentName: string;
  download?: boolean; // Return as download vs inline
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error
            }
          },
        },
      }
    );

    // Get session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body: GenerateRequest = await request.json();
    const { eventId, studentName, download = true } = body;

    if (!eventId || !studentName) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, studentName" },
        { status: 400 }
      );
    }

    // 3. Fetch certificate template
    const { data: template, error: templateError } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("event_id", eventId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Certificate template not found for this event" },
        { status: 404 }
      );
    }

    // 4. Verify user has permission (must be organizer of the event)
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizer_id !== user.id) {
      return NextResponse.json(
        { error: "Only event organizers can generate certificates" },
        { status: 403 }
      );
    }

    // 4b. Check sponsorship settlement (GATING)
    const settled = await isSponsorshipSettled(eventId);
    if (!settled) {
      return NextResponse.json(
        { ...sponsorshipNotSettledError(), code: "CERT_LOCKED_SPONSORSHIP_PENDING" },
        { status: 403 }
      );
    }

    // 5. Build certificate configuration
    const config = {
      basePdfUrl: template.base_pdf_url,
      studentName: studentName.trim(),
      nameFont: template.name_font,
      nameFontSize: template.name_font_size,
      nameColor: template.name_color,
      nameAlign: template.name_align as "left" | "center" | "right",
      namePosX: Number(template.name_pos_x),
      namePosY: Number(template.name_pos_y),
    };

    // 6. Validate configuration
    const validation = validateCertificateConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid certificate configuration", details: validation.errors },
        { status: 400 }
      );
    }

    // 7. Generate certificate PDF
    const pdfBytes = await generateCertificate(config);

    // 8. Return PDF
    const fileName = `${studentName.replace(/\s+/g, "_")}_Certificate.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`,
        "Content-Length": pdfBytes.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate certificate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if certificate template exists
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error
            }
          },
        },
      }
    );

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get event ID from query params
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("event_id", eventId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ exists: false, template: null });
    }

    return NextResponse.json({ exists: true, template });
  } catch (error) {
    console.error("Template check error:", error);
    return NextResponse.json(
      { error: "Failed to check template", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
