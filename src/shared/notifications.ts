export type NotificationKind = "info" | "warning" | "error";

export type NotificationEvent = {
    kind: NotificationKind;
    message: string;
};

type Listener = (e: NotificationEvent) => void;

const listeners = new Set<Listener>();

export const notifications = {
    emit(e: NotificationEvent): void {
        listeners.forEach(l => l(e));
    },

    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    // Convenience helpers
    info(message: string): void { this.emit({ kind: "info", message }); },
    warning(message: string): void { this.emit({ kind: "warning", message }); },
    error(message: string): void { this.emit({ kind: "error", message }); },
};
