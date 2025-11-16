import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { itinerary } = await req.json();
    
    if (!itinerary) {
      return new Response(
        JSON.stringify({ error: "Itinerary text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Extracting locations from itinerary...");

    // Use Lovable AI to extract locations with coordinates
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a travel location extraction assistant. Extract all significant locations (cities, landmarks, attractions, neighborhoods) from the itinerary with their details, coordinates, descriptions, and top recommendations."
          },
          {
            role: "user",
            content: `Extract all locations from this itinerary with detailed information:\n\n${itinerary}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_locations",
              description: "Extract locations with their coordinates, descriptions, and recommendations from a travel itinerary",
              parameters: {
                type: "object",
                properties: {
                  locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { 
                          type: "string",
                          description: "The name of the location (e.g., 'Tokyo Tower', 'Paris, France')"
                        },
                        coordinates: {
                          type: "array",
                          items: { type: "number" },
                          minItems: 2,
                          maxItems: 2,
                          description: "Longitude and latitude [lng, lat] in decimal degrees"
                        },
                        type: {
                          type: "string",
                          enum: ["city", "attraction", "landmark", "neighborhood"],
                          description: "Type of location"
                        },
                        description: {
                          type: "string",
                          description: "A brief 1-2 sentence description of the location highlighting what makes it special"
                        },
                        recommendations: {
                          type: "array",
                          items: { type: "string" },
                          description: "Top 3-5 things to do, see, or experience at this location",
                          minItems: 3,
                          maxItems: 5
                        }
                      },
                      required: ["name", "coordinates", "type", "description", "recommendations"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["locations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_locations" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned status ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const locations = JSON.parse(toolCall.function.arguments).locations;
    
    console.log(`Successfully extracted ${locations.length} locations`);

    return new Response(
      JSON.stringify({ locations }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Extract locations error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to extract locations from itinerary"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
