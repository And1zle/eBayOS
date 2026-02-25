import { Message, MessageThread } from '../types';

export interface GhostFactor {
  name: string;
  weight: number;     // 0-100, contribution to final score
  explanation: string;
}

export interface GhostRiskAnalysis {
  score: number;      // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: GhostFactor[];
  recommendations: string[];
}

/**
 * Analyze buyer ghost risk using rule-based heuristics
 * No API calls needed - fast local analysis
 */
export function analyzeGhostRisk(
  message: Message,
  thread: MessageThread
): GhostRiskAnalysis {
  const factors: GhostFactor[] = [];
  let baseScore = 0;

  // Factor 1: Buyer Rating (HIGH IMPACT)
  const rating = thread.buyer_info.rating;
  if (rating < 3.0) {
    factors.push({
      name: 'Low Buyer Rating',
      weight: 25,
      explanation: `Rating ${rating}/5 suggests unreliable buyer history`,
    });
    baseScore += 25;
  } else if (rating < 4.0) {
    factors.push({
      name: 'Below Average Rating',
      weight: 12,
      explanation: `Rating ${rating}/5 below 4.0 threshold`,
    });
    baseScore += 12;
  }

  // Factor 2: Transaction Count (MEDIUM IMPACT)
  const txCount = thread.buyer_info.transaction_count;
  if (txCount < 5) {
    factors.push({
      name: 'New/Inexperienced Buyer',
      weight: 15,
      explanation: `Only ${txCount} transactions - may not commit`,
    });
    baseScore += 15;
  }

  // Factor 3: Message Age (MEDIUM IMPACT)
  const messageAgeDays = Math.floor(
    (Date.now() - new Date(message.timestamp).getTime()) / 86400000
  );
  if (messageAgeDays > 7 && message.status === 'unanswered') {
    factors.push({
      name: 'Stale Unanswered Message',
      weight: 20,
      explanation: `Message ${messageAgeDays} days old and still unanswered`,
    });
    baseScore += 20;
  }

  // Factor 4: Message Content Keywords (LOWER IMPACT)
  const text = message.message_text.toLowerCase();
  const urgentKeywords = [
    'offer',
    'negotiate',
    'deal',
    'lowest',
    'best price',
    'bulk',
  ];
  const hesitantKeywords = ['maybe', 'might', 'probably', 'interested if'];

  const hasUrgentKeyword = urgentKeywords.some(kw => text.includes(kw));
  const hasHesitantKeyword = hesitantKeywords.some(kw => text.includes(kw));

  if (hasHesitantKeyword) {
    factors.push({
      name: 'Hesitant Language',
      weight: 10,
      explanation: 'Message contains conditional/uncertain phrasing',
    });
    baseScore += 10;
  }

  if (hasUrgentKeyword) {
    // DISCOUNT if urgent language (buyer is engaged)
    factors.push({
      name: 'Engaged Buyer',
      weight: -15,
      explanation: 'Message shows active negotiation interest',
    });
    baseScore -= 15;
  }

  // Factor 5: Response Time Pattern (MEDIUM IMPACT)
  if (thread.last_response_time) {
    const lastResponseAgeDays = Math.floor(
      (Date.now() - new Date(thread.last_response_time).getTime()) / 86400000
    );
    if (lastResponseAgeDays > 14) {
      factors.push({
        name: 'Slow Response Pattern',
        weight: 18,
        explanation: `Last seller response was ${lastResponseAgeDays} days ago`,
      });
      baseScore += 18;
    }
  }

  // Normalize score to 0-100
  const finalScore = Math.max(0, Math.min(100, baseScore));

  // Determine risk level
  const level: GhostRiskAnalysis['level'] =
    finalScore >= 60 ? 'HIGH' : finalScore >= 35 ? 'MEDIUM' : 'LOW';

  // Generate recommendations
  const recommendations: string[] = [];

  if (level === 'HIGH') {
    recommendations.push('🔴 Send immediate offer to re-engage buyer');
    recommendations.push('Consider 10-15% discount to close deal');
    recommendations.push(
      'Follow up with direct message (optional: mention other interested buyers)'
    );
  } else if (level === 'MEDIUM') {
    recommendations.push('✅ Send friendly follow-up with small incentive (5-10% off)');
    recommendations.push('Highlight item details they asked about');
  } else {
    recommendations.push('✓ Low risk - buyer likely genuine');
    recommendations.push('Respond naturally and address their questions');
  }

  return {
    score: Math.round(finalScore),
    level,
    factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)), // Sort by impact
    recommendations,
  };
}
