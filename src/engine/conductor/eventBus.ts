/**
 * src/engine/conductor/eventBus.ts
 * Conductor Core — Typed EventBus
 *
 * A lightweight typed publish/subscribe system for ConductorEvent objects.
 * Consumers call on() to register listeners and emit() to broadcast events.
 * The Conductor, BeatPlayer, and physioDetector all communicate through this bus.
 */

import type { ConductorEvent } from './types';

type EventListener = (event: ConductorEvent) => void;

export class EventBus {
  private listeners: Map<ConductorEvent['type'], EventListener[]> = new Map();

  /**
   * Subscribe to a specific event type.
   * Returns an unsubscribe function for convenience.
   */
  on<T extends ConductorEvent['type']>(
    eventType: T,
    listener: (event: Extract<ConductorEvent, { type: T }>) => void
  ): () => void {
    const bucket = this.listeners.get(eventType) ?? [];
    bucket.push(listener as EventListener);
    this.listeners.set(eventType, bucket);

    return () => this.off(eventType, listener as EventListener);
  }

  /**
   * Unsubscribe a specific listener from an event type.
   */
  off<T extends ConductorEvent['type']>(
    eventType: T,
    listener: (event: Extract<ConductorEvent, { type: T }>) => void
  ): void {
    const bucket = this.listeners.get(eventType);
    if (!bucket) return;
    const index = bucket.indexOf(listener as EventListener);
    if (index !== -1) {
      bucket.splice(index, 1);
    }
  }

  /**
   * Emit an event to all registered listeners for its type.
   */
  emit(event: ConductorEvent): void {
    const bucket = this.listeners.get(event.type);
    if (!bucket) return;
    // Iterate over a copy in case a listener mutates the array.
    for (const listener of [...bucket]) {
      listener(event);
    }
  }

  /**
   * Remove all listeners (useful on cleanup / scenario reset).
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Remove all listeners for a specific event type.
   */
  clearType(eventType: ConductorEvent['type']): void {
    this.listeners.delete(eventType);
  }
}
