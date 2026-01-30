import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventTitle, eventDescription, eventDate, eventLocation } = body;

    // Create calendar event
    const calendarEvent = {
      summary: eventTitle,
      description: eventDescription,
      location: eventLocation,
      start: {
        dateTime: new Date(eventDate).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(
          new Date(eventDate).getTime() + 2 * 60 * 60 * 1000
        ).toISOString(),
        timeZone: "UTC",
      },
    };

    // Get the user's access token from the session
    // Note: This requires setting up Google OAuth properly
    const accessToken = (session as any).accessToken;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Google Calendar access not available. Please reconnect your Google account.",
        },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(
      { message: "Event added to Google Calendar", eventId: data.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding event to Google Calendar:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to add event to Google Calendar",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Calendar access not available" },
        { status: 401 }
      );
    }

    // Get upcoming events from Google Calendar
    const now = new Date().toISOString();
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?timeMin=${now}&maxResults=10&orderBy=startTime&singleEvents=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data.items || []);
  } catch (error: any) {
    console.error("Error fetching Google Calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch Google Calendar events" },
      { status: 500 }
    );
  }
}
