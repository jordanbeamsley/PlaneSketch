import type { SnapResult, SnapRule, SnapRuleContext } from "./types";

export class SnapEngine {
    private rules: SnapRule[];

    constructor(rules: SnapRule[]) {
        this.rules = rules;
    }

    snap(ctx: SnapRuleContext): SnapResult {
        const candidates = this.rules.flatMap(r => r.evaluate(ctx));

        // No snaps found, return the current pointer location
        if (candidates.length === 0) return { kind: "none", p: ctx.p };

        // Optional hysterisis: prefer last snap
        const stickyMul = (ctx.opts.hysterisisMult && ctx.opts.lastTarget) ? ctx.opts.hysterisisMult : 1.0;

        // Engine ranks and selects best snap candidate
        // Start with first candidate and iteratively check
        let best = candidates[0];
        let bestScore = this.score(best, ctx, stickyMul);

        candidates.forEach(c => {
            const s = this.score(c, ctx, stickyMul);
            if (s > bestScore) { best = c, bestScore = s }
        })

        return { kind: best.kind, p: best.p, meta: { id: best.id ?? '' } }

    }

    // Assign a score to each candidate based on dist2, rule priority and last snap hysterisis
    // Larger score = more preferred
    score(candidate: { dist2: number, priority?: number, id?: string }, ctx: SnapRuleContext, stickyMul: number) {
        // Use dist2 as the base score, add a tiny epsilon to avoid divide by 0
        const base = 1 / (candidate.dist2 + 1e-6);
        const priority = (candidate.priority ?? 0) * 1e-3 // Tunable weighting of priority

        // If current candidate is = last snap, add weighting based on stickyMul
        const sticky = (ctx.opts.lastTarget && candidate.id && (ctx.opts.lastTarget.id === candidate.id))
            ? stickyMul : 1.0;

        return base * sticky + priority;
    }
}
