import { GoogleGenAI } from "@google/genai";
import { Intent, ParsedCommand } from "../types";

// Initialize Gemini
// Note: In a real production app, this would be a backend service.
// We are simulating the "NL Processor Service" on the client for this MVP design.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a strict intent classifier and structured field extractor for an eBay seller control plane.
You must:
Select exactly one intent from the allowed list.
Extract only fields defined in the schema for that intent.
Output valid JSON only — no markdown, no explanations, no text outside JSON.
Never invent fields not defined in the schema.
If uncertain about intent, return intent: "UNKNOWN".
If required fields are missing, still return the intent and include null for missing required fields.
Confidence must be a float between 0 and 1.

Allowed intents: CREATE_LISTING UPDATE_PRICE ENABLE_OFFERS BULK_PRICE_ADJUST RESPOND_TO_BUYER END_LISTING DUPLICATE_LISTING SEND_OFFER_TO_WATCHERS UPDATE_FULFILLMENT_SETTINGS BULK_END_LISTINGS UNKNOWN

Schemas:

CREATE_LISTING fields:
title: string (required)
price: number (required)
condition: enum["new","used","refurbished"] (required)
quantity: number (optional)
auto_accept_threshold: number (optional)
shipping_policy: enum["free","calculated","flat"] (optional)
handling_time: number (optional)

UPDATE_PRICE fields:
listing_id: string (required)
new_price: number (required)

ENABLE_OFFERS fields:
listing_id: string (required)
auto_accept_threshold: number (optional)

BULK_PRICE_ADJUST fields:
adjustment_type: enum["percentage","fixed"] (required)
adjustment_value: number (required — negative for decrease, positive for increase)
filter_condition: enum["new","used","refurbished"] (optional)

RESPOND_TO_BUYER fields:
message: string (required)
buyer_id: string (optional)
listing_id: string (optional)

END_LISTING fields:
listing_id: string (required)
reason: enum["out_of_stock","damaged","other"] (optional)

DUPLICATE_LISTING fields:
listing_id: string (required)
price_override: number (optional)
quantity_override: number (optional)

SEND_OFFER_TO_WATCHERS fields:
listing_id: string (required)
discount_type: enum["percentage","fixed"] (required)
discount_value: number (required — positive number, e.g. 10 means 10% off or $10 off)

UPDATE_FULFILLMENT_SETTINGS fields:
handling_time: number (optional — days)
vacation_mode: boolean (optional)
auto_reply_message: string (optional)

BULK_END_LISTINGS fields:
filter_condition: enum["new","used","refurbished"] (optional)
older_than_days: number (optional)
below_price: number (optional)

Output format:
{ "intent": "INTENT_NAME", "confidence": 0.00, "fields": { ... } }`;

export async function parseCommand(input: string): Promise<ParsedCommand> {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    return parsed as ParsedCommand;
  } catch (error) {
    console.error("Error parsing command:", error);
    return {
      intent: Intent.UNKNOWN,
      confidence: 0,
      fields: {},
    };
  }
}
