// Workaround for @supabase/realtime-js referencing internal subpaths of @supabase/phoenix
// that are not exposed in its `exports` field (incompatible with moduleResolution: "bundler").
// See: https://github.com/supabase/realtime-js/issues

declare module '@supabase/phoenix/priv/static/types/timer' {
  export default class Timer {
    constructor(callback: () => void, timerCalc: (tries: number) => number);
    callback: () => void;
    timerCalc: (tries: number) => number;
    timer: ReturnType<typeof setTimeout> | undefined;
    tries: number;
    reset(): void;
    scheduleTimeout(): void;
  }
}

declare module '@supabase/phoenix/priv/static/types/types' {
  export type Vsn = '1.0.0' | '2.0.0';
  export type Params = Record<string, unknown>;
  export type Closure<T> = T | (() => T);
  export type ChannelBindingCallback = (
    payload: unknown,
    ref: string | null | undefined,
    joinRef: string,
  ) => void;
  export type ChannelOnErrorCallback = (reason: unknown) => void;
  export type ChannelBinding = {
    event: string;
    ref: number;
    callback: ChannelBindingCallback;
  };
  export type ChannelOnMessage = (
    event: string,
    payload?: unknown,
    ref?: string | null,
    joinRef?: string | null,
  ) => unknown;
  export type ChannelFilterBindings = (
    binding: ChannelBinding,
    payload: unknown,
    ref?: string | null,
  ) => boolean;
  export type SocketState = string;
  export type ChannelState = string;
  export type ChannelEvent = string;
  export type Transport = string;
  export type XhrState = number;
  export type PresenceEvents = { state: string; diff: string };
  export type PresenceOnJoin = (
    key: string,
    currentPresence: PresenceState,
    newPresence: PresenceState,
  ) => void;
  export type PresenceOnLeave = (
    key: string,
    currentPresence: PresenceState,
    leftPresence: PresenceState,
  ) => void;
  export type PresenceOnSync = () => void;
  export type PresenceDiff = { joins: PresenceState; leaves: PresenceState };
  export type PresenceState = {
    metas: { phx_ref?: string; phx_ref_prev?: string; [key: string]: unknown }[];
  };
  export type PresenceOptions = { events?: PresenceEvents | undefined };
  export type Message<T> = {
    join_ref?: string | null;
    ref?: string | null;
    event: string;
    topic: string;
    payload: T;
  };
  export type Encode<T> = (
    msg: Message<Record<string, unknown>>,
    callback: (result: ArrayBuffer | string) => T,
  ) => T;
  export type Decode<T> = (
    rawPayload: ArrayBuffer | string,
    callback: (msg: Message<unknown>) => T,
  ) => T;
  export type HeartbeatStatus = 'sent' | 'ok' | 'error' | 'timeout' | 'disconnected';
  export type HeartbeatCallback = (status: HeartbeatStatus, latency?: number) => void;
}