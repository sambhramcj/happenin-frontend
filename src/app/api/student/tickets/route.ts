import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST: Create ticket when student registers
export async function POST(req: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get event and registration IDs from request
    const { eventId, registrationId } = await req.json();
    if (!eventId || !registrationId) {
      return NextResponse.json(
        { error: "Missing eventId or registrationId" },
        { status: 400 }
      );
    }

    const studentEmail = session.user.email as string;

    // 3. Verify student owns this registration
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, event_id, student_email")
      .eq("id", registrationId)
      .eq("student_email", studentEmail)
      .single();

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    // 4. Generate unique QR code data
    // Format: eventId:registrationId:timestamp
    const qrData = `${eventId}:${registrationId}:${Date.now()}`;
    const ticketId = `TKT-${registrationId.slice(0, 8)}-${Date.now()}`;

    // 5. Prepare ticket data
    const ticketPayload = {
      ticket_id: ticketId,
      event_id: eventId,
      registration_id: registrationId,
      student_email: studentEmail,
      qr_code_data: qrData,
      design_template: "modern",
      status: "active",
      created_at: new Date().toISOString(),
    };

    // 6. Insert ticket into database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let ticketResult: any;
    if (supabaseUrl && serviceRole) {
      const admin = createClient(supabaseUrl, serviceRole, {
        auth: { persistSession: false },
      });
      ticketResult = await admin
        .from("tickets")
        .insert(ticketPayload)
        .select()
        .single();
    } else {
      ticketResult = await supabase
        .from("tickets")
        .insert(ticketPayload)
        .select()
        .single();
    }

    if (ticketResult.error) {
      console.error("Ticket creation error:", ticketResult.error);
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ticket: ticketResult.data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/student/tickets error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List all student's tickets
export async function GET(req: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email as string;

    // 2. Fetch all tickets for this student
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(
        `id,
        ticket_id,
        event_id,
        registration_id,
        student_email,
        event_title,
        event_date,
        event_location,
        qr_code_data,
        design_template,
        created_at`
      )
      .eq("student_email", studentEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch tickets error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: tickets || [] }, { status: 200 });
  } catch (err) {
    console.error("GET /api/student/tickets error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
