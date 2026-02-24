# eBayOS Architecture

A React + TypeScript command-plane UI for managing eBay listings via natural language, powered by Claude API intent parsing.

## System Overview

```
User Command (Natural Language)
    ↓
CommandBar Component
    ↓
intentParser.ts (Claude API)
    ↓
Intent + Fields JSON
    ↓
spellExecutor.ts (Handler)
    ↓
API Call (POST /api/*)
    ↓
Express Server (server.ts)
    ↓
eBay Backend (http://ebay-listing-assistant:5000)
    ↓
Response
    ↓
ExecutionPanel (Diff Preview)
    ↓
User Confirmation
    ↓
Final Execution → Results Display
```

## Core Components

### 1. CommandBar (Input Layer)
**File**: `src/components/CommandBar.tsx`

- Text input for natural language commands
- "READY" badge when listening
- Pre-fills from RightSidebar command selection
- Sends text to intentParser.ts

### 2. Intent Parser (Logic Layer)
**File**: `src/services/intentParser.ts`

- Calls Claude API with SYSTEM_PROMPT
- SYSTEM_PROMPT includes all 10 intent schemas as JSON examples
- Returns structured: `{ intent: Intent, fields: { ... } }`
- Example:
  ```json
  {
    "intent": "UPDATE_PRICE",
    "fields": {
      "listing_id": "123456789",
      "adjustment_value": -2.50
    }
  }
  ```

### 3. Spell Executor (Execution Layer)
**File**: `src/services/spellExecutor.ts`

Maps intent → handler → API call:

```
UPDATE_PRICE → calculateNewPrice() → POST /api/update-price
BULK_PRICE_ADJUST → filterListings() + loop → POST /api/update-price (per item)
END_LISTING → checkWatchers() + checkBids() → POST /api/end-listing
ENABLE_OFFERS → validateDiscount() → POST /api/enable-offers
... (10 total intents)
```

Each handler:
1. Validates input
2. Calls API endpoint
3. Checks response for errors
4. Returns { success, message, affected_count }

### 4. Execution Panel (Preview & Confirmation)
**File**: `src/components/ExecutionPanel.tsx`

- Fetches current listings from /api/active-listings
- Computes "before" state
- Shows what intent WOULD do (preview diff)
- Colors: emerald (good), amber (warning), red (danger)
- Destructive intents require confirmation
- On confirm: executes final API call

### 5. Market Pulse Dashboard
**File**: `src/components/MarketPulse.tsx`

Four F-Key tabs (Alt+1 through Alt+4):

#### Alt+1: Liquidity (Capital Aging)
- Buckets: 0–30d (Liquid), 30–90d (Slowing), 90d+ (Trapped)
- Shows: capital in each bucket, percentage of total
- Stacked progress bar visualization
- Purpose: Identify stagnant inventory

#### Alt+2: Market I/O (Price Distribution)
- Buckets: $0–25, $25–50, $50–100, $100–250, $250+
- Bar chart: count of listings per price tier
- Stat cards: Total Listed Value, Avg Watchers
- Purpose: Understand pricing breadth

#### Alt+3: Drift (Watcher Concentration)
- Bar chart: Avg watchers by price tier
- Top 3 most-watched items with counts
- Purpose: Find high-demand products

#### Alt+4: Telemetry (Watch Pressure)
- Stat cards: Watch Pressure ($), Active Bids ($)
- Pressure Index: price × watchers (normalized bar chart)
- Top 4 items by pressure
- Purpose: Find items close to selling

### 6. Command Library (RightSidebar)
**File**: `src/components/RightSidebar.tsx`

Organized by category:
- **Inventory** (blue): CREATE, END, DUPLICATE, BULK_END
- **Pricing** (emerald): UPDATE_PRICE, BULK_PRICE_ADJUST
- **Negotiation** (purple): ENABLE_OFFERS, SEND_OFFER, RESPOND
- **Account Controls** (amber): UPDATE_FULFILLMENT

Each category collapsible. Click → CommandBar prefills + ExecutionPanel shows preview.

### 7. Smart Suggestions
**File**: `src/components/SmartSuggestions.tsx`

AI-powered recommendations:
- Price Optimization: "9 items with watchers but no bids — decrease price 5%"
- Stale Inventory: "47 items listed >90 days — enable offers with 20% auto-accept"
- Low Visibility: "51 items with <2 watchers — review titles"

### 8. Intuition Engine (Left Sidebar)
**File**: `src/components/IntuitionEngine.tsx`

Seller DNA display:
- Voice: Description of seller personality
- Pricing Strategy: How to price items
- Stats: Learned categories, price changes, etc.

## Data Flow Example: Bulk Price Decrease

```
User types: "Decrease price of high-watch/no-bid items by 5%"
    ↓
CommandBar sends to intentParser
    ↓
Claude parses: {
  intent: "BULK_PRICE_ADJUST",
  fields: {
    filter_condition: "high_watch_no_bid",
    adjustment_value: -5.0
  }
}
    ↓
ExecutionPanel.useDiffPreview() hook:
  1. Fetches /api/active-listings
  2. Filters items: (watchers >= 3 AND bids === 0)
  3. Calculates: old_avg_price → new_avg_price
  4. Shows: "9 items, avg $45.50 → $43.22" with diffs
    ↓
User clicks "Confirm"
    ↓
spellExecutor.ts loops through filtered items:
  for each item: POST /api/update-price { listing_id, adjustment_value: -5 }
    ↓
Express server.ts routes to /api/update-price:
  Validates input → forwards to http://ebay-listing-assistant:5000
    ↓
Response: { success: true, affected: 9, new_avg_price: 43.22 }
    ↓
ExecutionPanel displays: "✓ 9 prices updated. New avg: $43.22"
```

## State Management

Minimal, React hooks only (no Redux/Zustand):

- `CommandBar`: local useState for input text
- `ExecutionPanel`: useState for loading, result, error
- `MarketPulse`: useState for activeTab, listings, loading
- `RightSidebar`: useState for collapsed category state

Context used sparingly (CommandBar input context for prefill).

## API Contract

**Base URL**: `/api` (proxied via server.ts)

### Request Format
```typescript
POST /api/[endpoint]
Content-Type: application/json

{
  // Intent-specific fields
  "listing_id": "123456789",
  "adjustment_value": -5.0
  // ... more fields
}
```

### Response Format
```typescript
{
  "success": true,
  "message": "9 items updated",
  "affected_count": 9,
  "warnings": ["Item ABC123 has active bids"]
}
```

## Frontend Build Pipeline

```
src/
  ↓
TypeScript Compiler (tsc)
  ↓
Vite Build (React JSX → JS, bundle)
  ↓
Tailwind CSS Processing
  ↓
dist/
  ↓
Served by Express server.ts (port 4873)
```

## Backend Integration

**File**: `server.ts`

```typescript
// All /api/* requests proxied to:
http://ebay-listing-assistant:5000

// Example:
POST /api/update-price → POST http://ebay-listing-assistant:5000/api/update-price
```

**Why proxy?**
- Avoids CORS issues (same-origin)
- Hides backend URL from client
- Allows middleware (logging, auth, rate-limit) in future

## Deployment Architecture

```
Docker Image: ebayos:latest
  ├── Node 20 base
  ├── npm install (dependencies)
  ├── npm run build (React + TypeScript build)
  ├── OpenSSL (self-signed cert generation)
  └── Express server starts

Container: ebayos
  ├── HTTPS on :4873 (cert.pem, key.pem)
  ├── Proxies /api/* → http://ebay-listing-assistant:5000
  └── Serves dist/ (React SPA)

Network: Tailscale
  ├── Server: pop-os.tail2de5b8.ts.net
  ├── IP: 100.67.134.63
  └── SSH: houdinib@100.67.134.63
```

## Error Handling

1. **Parser Errors**: Claude returns invalid JSON
   - User sees: "Could not understand command. Try: 'Decrease price by 5%'"

2. **Executor Errors**: API returns 4xx/5xx
   - Caught in spellExecutor.ts handler
   - User sees: "Failed to update prices: [error message]"

3. **Warnings**: Non-fatal (e.g., item has active bids)
   - ExecutionPanel shows orange warning badge
   - User can still proceed or cancel

## Testing Strategy

- **Manual**: Use preview dashboard (localhost:4874)
- **E2E**: Test full command flow (text → parser → executor → API)
- **Unit**: Parser schema validation, executor filtering logic
- **Integration**: API response handling, diff preview accuracy

## Future Enhancements

1. **Bulk Operations**: Queue multiple intents, batch execute
2. **Undo/Redo**: Store operation history, rollback capability
3. **Analytics**: Track command success rates, most-used intents
4. **Custom Rules**: Save & replay favorite intent patterns
5. **Mobile**: Responsive UI for tablets/phones
6. **Real-time Sync**: WebSocket updates to dashboard metrics
