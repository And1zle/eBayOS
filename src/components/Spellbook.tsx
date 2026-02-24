import React from 'react';
import { Book, ArrowRight } from 'lucide-react';
import { Intent } from '@/types';

interface SpellbookProps {
  onSelectExample: (text: string) => void;
}

export function Spellbook({ onSelectExample }: SpellbookProps) {
  const spells = [
    {
      intent: Intent.CREATE_LISTING,
      title: "Create Listing",
      description: "List a new item for sale.",
      examples: [
        "List a used iPhone 12 for $275",
        "Sell a new Nike Hoodie for $50 with free shipping",
        "Create listing: Vintage Lamp, $120, used condition"
      ]
    },
    {
      intent: Intent.UPDATE_PRICE,
      title: "Update Price",
      description: "Change the price of a specific listing.",
      examples: [
        "Update listing 12345 price to $19.99",
        "Change price of item ABC to $150"
      ]
    },
    {
      intent: Intent.ENABLE_OFFERS,
      title: "Enable Offers",
      description: "Turn on Best Offer for a listing.",
      examples: [
        "Enable offers on listing 98765",
        "Turn on offers for item XYZ with auto accept at $40"
      ]
    },
    {
      intent: Intent.BULK_PRICE_ADJUST,
      title: "Bulk Price Adjust",
      description: "Modify prices for multiple items at once.",
      examples: [
        "Increase all used listings by 10%",
        "Decrease all prices by $5",
        "Raise price of all new items by 5%"
      ]
    },
    {
      intent: Intent.RESPOND_TO_BUYER,
      title: "Respond to Buyer",
      description: "Send a message to a buyer.",
      examples: [
        "Reply to buyer: Thank you for your offer, I can accept $45",
        "Message buyer 123: Your item has shipped"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Book className="w-6 h-6 text-indigo-600" />
          The Spellbook
        </h2>
        <p className="text-zinc-500 mt-1">
          Reference guide for available natural language commands.
        </p>
      </div>

      <div className="grid gap-6">
        {spells.map((spell) => (
          <div key={spell.intent} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-zinc-900">{spell.title}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">{spell.intent}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-600 mb-4">{spell.description}</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Examples</p>
                {spell.examples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectExample(example)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-zinc-50 hover:bg-indigo-50 text-zinc-700 hover:text-indigo-700 text-sm font-mono transition-colors flex items-center justify-between group"
                  >
                    <span>{example}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
