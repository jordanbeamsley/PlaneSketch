import type {
    residualDwellState,
    SnapCandidate,
    SnapDataSource,
    SnapKind,
    SnapResult,
    SnapRuleContext,
} from "./types";
import { SnapEngine } from "./engine";
import type { Viewport } from "../camera/viewportService";
import type { Container, Point, Renderer, Ticker } from "pixi.js";
import { SnapOverlay } from "./overlay";
import { parseRefKey, type EntityRef } from "../models/sketch/entityRef";
import { copyVec, dist2, type Vec2 } from "../models/sketch/vectors";
import { SNAP_RADIUS } from "../constants/drawing";
import {
    axisHRule,
    axisVRule,
    circleRule,
    gridRule,
    nodeRule,
    originRule,
    segmentRule,
} from "./rules";
import { RESIDUAL_DWELL_MS, RESIDUAL_MAX_DRIFT_PX2 } from "../constants/tools";

// Higher order types than those used by SnapEngine
// This is whats passed back to the tools to drive constraints

export interface SnapTarget {
    kind: SnapKind;
    ref?: EntityRef;
}

export interface SnapOutcome {
    p: Vec2;
    primary?: SnapTarget;
    residual?: SnapTarget;
}

/**
 * Snap service that uses pixi types and data and handles rending of hud objects, etc.
 * SnapEngine is the pure logic/ testable underlay */
export class SnapService {
    private snapContext: SnapRuleContext;
    private snapEngine: SnapEngine;
    private residualDwell: residualDwellState;
    private snapOverlay: SnapOverlay;
    private ticker: Ticker;
    private lastSnapResult: SnapResult;
    private onDwellActivate: (s: SnapOutcome) => void;

    constructor(
        ds: SnapDataSource,
        vp: Viewport,
        hud: Container,
        ticker: Ticker,
        onDwellActivate: (s: SnapOutcome) => void = () => {},
    ) {
        this.snapContext = {
            p: { x: 0, y: 0 },
            ds: ds,
            viewport: vp,
            opts: {
                radius: SNAP_RADIUS,
                enable: {
                    node: true,
                    axisH: true,
                    axisV: true,
                    origin: true,
                    grid: true,
                    segment: true,
                    circle: true,
                },
                hysterisisMult: 1.5,
            },
        };
        this.snapEngine = new SnapEngine([
            nodeRule,
            axisHRule,
            axisVRule,
            originRule,
            gridRule,
            segmentRule,
            circleRule,
        ]);
        this.residualDwell = { startedAtMs: 0, active: false };
        this.snapOverlay = new SnapOverlay(hud, vp);
        this.ticker = ticker;
        this.onDwellActivate = onDwellActivate;
        this.lastSnapResult = {kind: "none", p: {x: 0, y: 0}};

        this.ticker.add(this.onTick, this);
    }

    unmount() {
        this.ticker.remove(this.onTick, this);
    }

    private toTarget(c?: Omit<SnapCandidate, "dist2">): SnapTarget | undefined {
        if (!c) return undefined;
        return {
            kind: c.kind,
            ref: c.id ? (parseRefKey(c.id) ?? undefined) : undefined,
        };
    }

    private resetResidual() {
        this.residualDwell = { startedAtMs: 0, active: false };
    }

    /** Translate the snap engine result and dwell state into a SnapOutcome that tools can consume */
    private buildOutcome(s: SnapResult): SnapOutcome {
        if (s.kind === "none") return { p: copyVec(s.p) };

        if (!s.residual || !this.residualDwell.active) {
            return {
                p: copyVec(s.p),
                primary: this.toTarget(s.primary),
            };
        }

        return {
            p: copyVec(s.residual.p),
            primary: this.toTarget(s.primary),
            residual: this.toTarget(s.residual),
        };
    }

    get lastOutcome() {
        return this.buildOutcome(this.lastSnapResult);
    }

    /** Call after the pixi app has been initialized */
    initOverlay(renderer: Renderer) {
        this.snapOverlay.initSprites(renderer);
    }

    /** Hide any visible snap indicators, e.g. while panning/zooming */
    hideOverlay() {
        this.snapOverlay.hideOverlay();
    }

    snap(world: Point, screen: Point): SnapOutcome {
        const snapResult = this.snapEngine.snap({
            ...this.snapContext,
            p: world,
        });
        this.lastSnapResult = snapResult;

        // No primary snap, or a primary snap with no residual candidate
        // Nothing to dwell on
        if (snapResult.kind === "none" || !snapResult.residual) {
            this.resetResidual();
            this.snapOverlay.render(snapResult);

            return this.buildOutcome(snapResult);
        }

        // There is a residual candidate
        // If the cursor has drifted or the residual has changed kind, then restart the dwell timer
        const pending = this.residualDwell.pending;
        if (
            !pending ||
            pending.kind !== snapResult.residual.kind ||
            dist2(screen, this.residualDwell.anchorScreen!) >
                RESIDUAL_MAX_DRIFT_PX2
        ) {
            this.residualDwell = {
                pending: snapResult.residual,
                anchorScreen: copyVec(screen),
                startedAtMs: performance.now(),
                active: false,
            };
        }

        // Only render / return the residual once the timer has elapsed
        this.snapOverlay.render(
            this.residualDwell.active
                ? snapResult
                : { ...snapResult, residual: undefined },
        );

        return this.buildOutcome(snapResult);
    }

    private onTick() {
        const pending = this.residualDwell.pending;

        // No residual pending or the residual is already active, nothing to do
        if (!pending || this.residualDwell.active) return;

        // Timer hasn't elapsed, nothing to do
        if (
            performance.now() - this.residualDwell.startedAtMs <
            RESIDUAL_DWELL_MS
        )
            return;

        const result = this.lastSnapResult;
        if (!result) return;

        this.residualDwell.active = true;
        this.snapOverlay.render(result);
        this.onDwellActivate(this.buildOutcome(result));
    }
}
