import { Message, MessageIntent, ActiveListing } from '../types';

/**
 * Generate 3 AI-powered reply suggestions for a buyer message
 * Uses Google Gemini to create contextual responses based on seller DNA
 */
export async function generateReplySuggestions(
  message: Message,
  sellerPersonality?: string
): Promise<string[]> {
  try {
    const prompt = `You are an eBay seller with this profile:
- Personality: ${sellerPersonality || 'professional and helpful'}
- Communication style: Clear, concise, professional

A buyer just sent you this message:
"${message.message_text}"

Generate exactly 3 professional, concise reply options (max 1 sentence each).
Each option should feel authentic and address the buyer's concern.

Return ONLY a JSON array with exactly 3 strings, like:
["reply1", "reply2", "reply3"]`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-3-flash-preview:generateContent?key=' +
        import.meta.env.VITE_GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
        }),
      }
    );

    if (!response.ok) {
      console.warn('[messageAnalyzer] Gemini API error:', response.statusText);
      return getDefaultSuggestions(message);
    }

    const data = await response.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON array from response
    try {
      const suggestions = JSON.parse(content);
      if (Array.isArray(suggestions) && suggestions.length === 3) {
        return suggestions.map(s => String(s).trim());
      }
    } catch {
      // JSON parse failed, return defaults
    }

    return getDefaultSuggestions(message);
  } catch (err) {
    console.warn('[messageAnalyzer] Error generating suggestions:', err);
    return getDefaultSuggestions(message);
  }
}

/**
 * Detect the intent of a buyer message
 * Auto-tags: PRICE_INQUIRY, SHIPPING_QUESTION, BULK_OFFER, COMPLAINT, PRAISE, OTHER
 */
export async function detectMessageIntent(
  messageText: string
): Promise<MessageIntent> {
  try {
    const prompt = `Classify this buyer message into exactly ONE category:
- PRICE_INQUIRY: Asking about price, negotiating, wants discount
- SHIPPING_QUESTION: Asking about shipping cost, time, method
- BULK_OFFER: Interested in buying multiple items
- COMPLAINT: Issue with item, seller, shipping, or service
- PRAISE: Positive feedback, compliment, repeat buyer signal
- OTHER: Doesn't fit above categories

Message: "${messageText}"

Respond with ONLY the category name, nothing else. No explanation.`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-3-flash-preview:generateContent?key=' +
        import.meta.env.VITE_GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 20 },
        }),
      }
    );

    if (!response.ok) {
      return MessageIntent.OTHER;
    }

    const data = await response.json();
    const intent =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Validate intent is one of our enums
    const validIntents = Object.values(MessageIntent);
    if (validIntents.includes(intent as MessageIntent)) {
      return intent as MessageIntent;
    }

    return MessageIntent.OTHER;
  } catch (err) {
    console.warn('[messageAnalyzer] Error detecting intent:', err);
    return MessageIntent.OTHER;
  }
}

/**
 * Extract item reference from message text
 * Finds item ID or matches by title, returns matching listing
 */
export async function extractItemReference(
  messageText: string,
  sellerItems: ActiveListing[]
): Promise<ActiveListing | null> {
  // Simple regex: look for "Item #123456" or "item 123456"
  const itemIdMatch = messageText.match(/item\s*#?(\d+)/i);
  if (itemIdMatch) {
    const itemId = itemIdMatch[1];
    return sellerItems.find(item => item.itemId === itemId) || null;
  }

  // If no item ID, try to use Gemini to match by title
  try {
    const prompt = `Extract the item name/title the buyer is referring to in this message:
"${messageText}"

Return ONLY the item title/name mentioned, or "NONE" if not specified.
Keep it short (max 50 chars).`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-3-flash-preview:generateContent?key=' +
        import.meta.env.VITE_GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 50 },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const extractedTitle =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (extractedTitle && extractedTitle !== 'NONE') {
      // Find item by title substring match
      return (
        sellerItems.find(item =>
          item.title.toLowerCase().includes(extractedTitle.toLowerCase())
        ) || null
      );
    }
  } catch (err) {
    console.warn('[messageAnalyzer] Error extracting item reference:', err);
  }

  return null;
}

/**
 * Default suggestions if Gemini fails
 */
function getDefaultSuggestions(message: Message): string[] {
  const msgLower = message.message_text.toLowerCase();

  // Price inquiry
  if (msgLower.includes('price') || msgLower.includes('lower')) {
    return [
      "Thanks for your interest! I'm firm on this price, but I can offer free shipping.",
      'I can negotiate on price if you buy now. What did you have in mind?',
      "This is my best price given the condition and market rate. Happy to answer other questions!",
    ];
  }

  // Shipping question
  if (msgLower.includes('shipping') || msgLower.includes('ship')) {
    return [
      'Shipping is $5.99 to the continental US. International shipping available.',
      'I ship within 24 hours of payment. Tracking provided.',
      'What is your zip code? I can calculate exact shipping for you.',
    ];
  }

  // Bulk offer
  if (msgLower.includes('bulk') || msgLower.includes('multiple')) {
    return [
      'Great! I can offer bulk pricing. How many are you interested in?',
      'I offer 10% discount for orders of 5+ items. What quantity interests you?',
      'Let me know the quantity and I can send you a custom invoice.',
    ];
  }

  // Complaint
  if (msgLower.includes('issue') || msgLower.includes('problem')) {
    return [
      "I apologize for the issue. Please let me know specifics and I'll make it right.",
      "I'm sorry you're experiencing this. Let's resolve it together.",
      'Please share more details and photos. I want to ensure your satisfaction.',
    ];
  }

  // Praise
  if (
    msgLower.includes('love') ||
    msgLower.includes('great') ||
    msgLower.includes('perfect')
  ) {
    return [
      'Thank you so much! Hope you enjoy it. Please leave feedback when you get a chance.',
      "Thanks! I really appreciate your business. Feel free to check my other listings.",
      "So glad you like it! Thanks for being a great buyer.",
    ];
  }

  // Generic fallback
  return [
    'Thanks for reaching out. How can I help?',
    'I appreciate your message. Let me know what you need.',
    'Thanks! Feel free to ask any other questions.',
  ];
}
