import { allowedResiduals } from "./constants";
import type { SnapCandidate, SnapKind, SnapResult, SnapRule, SnapRuleContext } from "./types";

export class SnapEngine {
    private rules: SnapRule[];
    private kindToRule: Partial<Record<SnapKind, SnapRule>> = {};

    constructor(rules: SnapRule[]) {
        this.rules = rules;

        for (const r of rules) {
            const k = r.name as SnapKind;
            this.kindToRule[k] = r;
        }
    }

    snap(ctx: SnapRuleContext): SnapResult {
        const candidates = this.rules.flatMap(r => r.evaluate(ctx));
        const scores: number[] = [];

        // No snaps found, return the current pointer location
        if (candidates.length === 0) return { kind: "none", p: ctx.p };

        // Optional hysterisis: prefer last snap
        const stickyMul = (ctx.opts.hysterisisMult && ctx.opts.lastTarget) ? ctx.opts.hysterisisMult : 1.0;

        // Engine ranks and selects best snap candidate
        // Start with first candidate and iteratively check
        let bestPrimary = candidates[0];
        let bestPrimaryScore = this.score(bestPrimary, ctx, stickyMul);

        candidates.forEach(c => {
            const s = this.score(c, ctx, stickyMul);
            // Keep track of scores for residuals evaluation
            scores.push(s);
            if (s > bestPrimaryScore) { bestPrimary = c, bestPrimaryScore = s }
        })

        const primaryResult = { kind: bestPrimary.kind, p: bestPrimary.p, id: bestPrimary.id ?? '' };

        const allowed = allowedResiduals[bestPrimary.kind];

        if (allowed.size === 0) return {
            kind: primaryResult.kind,
            p: primaryResult.p,
            primary: primaryResult,
            residual: undefined
        }

        // We already have the scores for the candidates
        // Evaluate if the primary snap works exactly for the residuals position
        let bestResidual: SnapCandidate | undefined = undefined;
        let bestResidualScore = 0;

        candidates.forEach((c, i) => {
            const score = scores[i];
            if (!allowed.has(c.kind) || c.kind === bestPrimary.kind) return;

            const rule = this.kindToRule[bestPrimary.kind];

            if (!rule?.validateAt) return;
            const ok = rule.validateAt(c.p, { ...ctx, entityId: primaryResult.id });

            if (!ok) return;

            if (score > bestResidualScore) {
                bestResidual = c;
                bestResidualScore = score;
            }
        });


        if (bestResidual !== undefined) {
            // TS narrowing residual as "never"
            // May need investigation in the future
            const r = bestResidual as SnapCandidate;

            return {
                kind: primaryResult.kind,
                p: primaryResult.p,
                primary: primaryResult,
                residual: { kind: r.kind, p: r.p, id: r.id ?? '' }
            }
        }

        return {
            kind: primaryResult.kind,
            p: primaryResult.p,
            primary: primaryResult,
            residual: undefined
        }

    }

    /** Assign a score to each candidate based on dist2, rule priority and last snap hysterisis
     *
     * Larger score = more preferred
    */
    score(candidate: { dist2: number, priority?: number, id?: string }, ctx: SnapRuleContext, stickyMul: number) {
        // Use dist2 as the base score, add a tiny epsilon to avoid divide by 0
        const base = 1 / (candidate.dist2 + 1e-6);
        const priority = (candidate.priority ?? 0) * 1e-2 // Tunable weighting of priority

        // If current candidate is = last snap, add weighting based on stickyMul
        const sticky = (ctx.opts.lastTarget && candidate.id && (ctx.opts.lastTarget.id === candidate.id))
            ? stickyMul : 1.0;

        return base * sticky + priority;
    }
}
