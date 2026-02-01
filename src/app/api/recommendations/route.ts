import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Calculate cosine similarity between two users based on their interactions
function calculateUserSimilarity(user1Interactions: any[], user2Interactions: any[]): number {
  const user1Events = new Map(user1Interactions.map(i => [i.event_id, i.interaction_weight]));
  const user2Events = new Map(user2Interactions.map(i => [i.event_id, i.interaction_weight]));
  
  const commonEvents = [...user1Events.keys()].filter(eventId => user2Events.has(eventId));
  
  if (commonEvents.length === 0) return 0;
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  commonEvents.forEach(eventId => {
    const weight1 = user1Events.get(eventId) || 0;
    const weight2 = user2Events.get(eventId) || 0;
    dotProduct += weight1 * weight2;
    magnitude1 += weight1 * weight1;
    magnitude2 += weight2 * weight2;
  });
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

// Calculate event similarity based on attributes
function calculateEventSimilarity(event1: any, event2: any): number {
  let score = 0;
  
  // Category match (40%)
  if (event1.category === event2.category) score += 0.4;
  
  // Location proximity (20%)
  if (event1.location === event2.location) score += 0.2;
  
  // Price range similarity (20%)
  const price1 = parseFloat(event1.price || 0);
  const price2 = parseFloat(event2.price || 0);
  const priceDiff = Math.abs(price1 - price2);
  if (priceDiff < 100) score += 0.2 * (1 - priceDiff / 100);
  
  // Club match (20%)
  if (event1.discount_club && event2.discount_club && event1.discount_club === event2.discount_club) {
    score += 0.2;
  }
  
  return score;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Get user's interactions
    const { data: userInteractions } = await supabase
      .from("user_event_interactions")
      .select("event_id, interaction_weight, interaction_type")
      .eq("user_email", userEmail);

    // Get user preferences
    const { data: userPrefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_email", userEmail)
      .single();

    // Get all future events
    const { data: allEvents } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", new Date().toISOString().split('T')[0])
      .order("event_date", { ascending: true });

    if (!allEvents || allEvents.length === 0) {
      return NextResponse.json([]);
    }

    // Get events user has already interacted with
    const interactedEventIds = new Set(userInteractions?.map(i => i.event_id) || []);

    // If no interaction history, return popular events filtered by preferences
    if (!userInteractions || userInteractions.length === 0) {
      let filteredEvents = allEvents;

      // Apply user preferences if available
      if (userPrefs) {
        if (userPrefs.preferred_categories?.length > 0) {
          filteredEvents = filteredEvents.filter(e => 
            userPrefs.preferred_categories.includes(e.category)
          );
        }
        if (userPrefs.max_price) {
          filteredEvents = filteredEvents.filter(e => 
            parseFloat(e.price || 0) <= userPrefs.max_price
          );
        }
      }

      // Sort by popularity (registration count)
      const { data: registrationCounts } = await supabase
        .from("registrations")
        .select("event_id")
        .in("event_id", filteredEvents.map(e => e.id));

      const countMap = new Map();
      registrationCounts?.forEach(r => {
        countMap.set(r.event_id, (countMap.get(r.event_id) || 0) + 1);
      });

      filteredEvents.sort((a, b) => (countMap.get(b.id) || 0) - (countMap.get(a.id) || 0));

      return NextResponse.json(filteredEvents.slice(0, 20));
    }

    // COLLABORATIVE FILTERING: Find similar users
    const { data: allInteractions } = await supabase
      .from("user_event_interactions")
      .select("user_email, event_id, interaction_weight")
      .neq("user_email", userEmail);

    // Group interactions by user
    const userInteractionMap = new Map<string, any[]>();
    allInteractions?.forEach(interaction => {
      if (!userInteractionMap.has(interaction.user_email)) {
        userInteractionMap.set(interaction.user_email, []);
      }
      userInteractionMap.get(interaction.user_email)!.push(interaction);
    });

    // Calculate similarity with other users
    const similarUsers: { email: string; similarity: number }[] = [];
    userInteractionMap.forEach((interactions, email) => {
      const similarity = calculateUserSimilarity(userInteractions, interactions);
      if (similarity > 0.1) { // Threshold for similar users
        similarUsers.push({ email, similarity });
      }
    });

    // Sort by similarity
    similarUsers.sort((a, b) => b.similarity - a.similarity);
    const topSimilarUsers = similarUsers.slice(0, 10);

    // Get events that similar users liked but current user hasn't seen
    const recommendedEventScores = new Map<string, number>();

    for (const similarUser of topSimilarUsers) {
      const { data: similarUserInteractions } = await supabase
        .from("user_event_interactions")
        .select("event_id, interaction_weight")
        .eq("user_email", similarUser.email)
        .in("interaction_type", ["like", "register", "share"]);

      similarUserInteractions?.forEach(interaction => {
        if (!interactedEventIds.has(interaction.event_id)) {
          const currentScore = recommendedEventScores.get(interaction.event_id) || 0;
          recommendedEventScores.set(
            interaction.event_id,
            currentScore + (interaction.interaction_weight * similarUser.similarity)
          );
        }
      });
    }

    // CONTENT-BASED FILTERING: Find similar events to ones user liked
    const likedEvents = userInteractions
      .filter(i => ["like", "register"].includes(i.interaction_type))
      .map(i => i.event_id);

    const { data: likedEventDetails } = await supabase
      .from("events")
      .select("*")
      .in("id", likedEvents);

    // Calculate similarity with all available events
    allEvents.forEach(event => {
      if (!interactedEventIds.has(event.id)) {
        let contentScore = 0;
        likedEventDetails?.forEach(likedEvent => {
          contentScore += calculateEventSimilarity(event, likedEvent);
        });
        
        const currentScore = recommendedEventScores.get(event.id) || 0;
        recommendedEventScores.set(event.id, currentScore + (contentScore * 0.5));
      }
    });

    // Apply user preferences boost
    if (userPrefs) {
      allEvents.forEach(event => {
        let prefBoost = 0;
        
        if (userPrefs.preferred_categories?.includes(event.category)) {
          prefBoost += 1;
        }
        if (userPrefs.preferred_colleges?.includes(event.college_id)) {
          prefBoost += 0.5;
        }
        if (userPrefs.max_price && parseFloat(event.price || 0) <= userPrefs.max_price) {
          prefBoost += 0.3;
        }
        
        if (prefBoost > 0) {
          const currentScore = recommendedEventScores.get(event.id) || 0;
          recommendedEventScores.set(event.id, currentScore + prefBoost);
        }
      });
    }

    // Sort events by score
    const recommendations = allEvents
      .filter(event => recommendedEventScores.has(event.id))
      .map(event => ({
        ...event,
        recommendation_score: recommendedEventScores.get(event.id)
      }))
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 20);

    // If not enough collaborative recommendations, add popular events
    if (recommendations.length < 10) {
      const remainingEvents = allEvents
        .filter(event => !interactedEventIds.has(event.id) && !recommendedEventScores.has(event.id))
        .slice(0, 10 - recommendations.length);
      
      recommendations.push(...remainingEvents);
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
