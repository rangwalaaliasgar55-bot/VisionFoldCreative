import { generateJson, isAiConfigured } from './aiProvider';

export interface LeadScoreResult {
  score: number; // 0–100
  tier: 'hot' | 'warm' | 'cold';
  reason: string;
  factors: string[];
  source: 'rules' | 'ai' | 'rules+ai';
}

export interface LeadInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budgetRange?: string;
  deadline?: string;
  message?: string;
}

function rulesScore(input: LeadInput): LeadScoreResult {
  let score = 35;
  const factors: string[] = [];
  const msg = (input.message || '').toLowerCase();
  const budget = (input.budgetRange || '').toLowerCase();
  const project = (input.projectType || '').toLowerCase();

  if ((input.company || '').trim().length > 1) {
    score += 10;
    factors.push('Company provided');
  }
  if ((input.phone || '').replace(/\D/g, '').length >= 10) {
    score += 8;
    factors.push('Valid phone');
  }
  if ((input.message || '').trim().length > 80) {
    score += 10;
    factors.push('Detailed brief');
  }
  if (/urgent|asap|this week|deadline|launch/i.test(msg)) {
    score += 12;
    factors.push('Urgency language');
  }
  if (/reel|short|tiktok|instagram|youtube|brand|campaign/i.test(msg + ' ' + project)) {
    score += 8;
    factors.push('Clear service fit');
  }
  if (/\d{2,}|₹|rs\.?|inr|budget|k\b/i.test(budget + ' ' + msg)) {
    score += 10;
    factors.push('Budget signal');
  }
  if (/enterprise|series [abc]|funded|agency/i.test(msg + ' ' + (input.company || ''))) {
    score += 12;
    factors.push('Scale signal');
  }
  if (!input.deadline) {
    score -= 3;
  } else {
    score += 5;
    factors.push('Deadline set');
  }

  score = Math.max(0, Math.min(100, score));
  const tier = score >= 70 ? 'hot' : score >= 45 ? 'warm' : 'cold';
  return {
    score,
    tier,
    reason: factors.length
      ? `Rules: ${factors.slice(0, 4).join('; ')}`
      : 'Baseline inquiry score',
    factors,
    source: 'rules',
  };
}

export async function scoreLead(input: LeadInput): Promise<LeadScoreResult> {
  const base = rulesScore(input);

  if (!isAiConfigured()) return base;

  try {
    const ai = await generateJson<{
      score?: number;
      tier?: string;
      reason?: string;
      factors?: string[];
    }>(
      `Score this video-editing studio lead 0-100. JSON keys: score, tier (hot|warm|cold), reason, factors (string[]).\n${JSON.stringify(input).slice(0, 2500)}`,
      'You qualify leads for VisionFold Creative (premium short/long-form video, India, INR). Be realistic. JSON only.',
      { temperature: 0.3, maxTokens: 350 }
    );

    const score =
      typeof ai.score === 'number'
        ? Math.max(0, Math.min(100, Math.round(ai.score)))
        : base.score;
    // Blend: 40% rules + 60% AI when AI responds
    const blended = Math.round(base.score * 0.4 + score * 0.6);
    const tier =
      ai.tier === 'hot' || ai.tier === 'warm' || ai.tier === 'cold'
        ? ai.tier
        : blended >= 70
          ? 'hot'
          : blended >= 45
            ? 'warm'
            : 'cold';

    return {
      score: blended,
      tier,
      reason: ai.reason || base.reason,
      factors: Array.isArray(ai.factors) && ai.factors.length ? ai.factors : base.factors,
      source: 'rules+ai',
    };
  } catch {
    return base;
  }
}
