// Workaround for @supabase/realtime-js referencing internal subpaths of @supabase/phoenix
// that are not exposed in its `exports` field (incompatible with moduleResolution: "bundler").
// See: https://github.com/supabase/realtime-js/issues

declare module '@supabase/phoenix/priv/static/types/timer' {
  /**
   * Clase de utilidad para timer.
   */
  export default class Timer {
    /**
     * Constructor de la clase o componente para inicializar dependencias.
     */
    constructor(callback: () => void, timerCalc: (tries: number) => number);
    /**
     * Propiedad para gestionar callback.
     */
    callback: () => void;
    /**
     * Propiedad para gestionar timer calc.
     */
    timerCalc: (tries: number) => number;
    /**
     * Propiedad para gestionar timer.
     */
    timer: ReturnType<typeof setTimeout> | undefined;
    /**
     * Propiedad para gestionar tries.
     */
    tries: number;
    /**
     * Método para reiniciar.
     */
    reset(): void;
    /**
     * Método para schedule timeout.
     */
    scheduleTimeout(): void;
  }
}

declare module '@supabase/phoenix/priv/static/types/types' {
  /**
   * Tipo de dato personalizado para vsn.
   */
  export type Vsn = '1.0.0' | '2.0.0';
  /**
   * Tipo de dato personalizado para params.
   */
  export type Params = Record<string, unknown>;
  /**
   * Tipo de dato personalizado para closure.
   */
  export type Closure<T> = T | (() => T);
  /**
   * Tipo de dato personalizado para channelbindingcallback.
   */
  export type ChannelBindingCallback = (
    payload: unknown,
    ref: string | null | undefined,
    joinRef: string,
  ) => void;
  /**
   * Tipo de dato personalizado para channelonerrorcallback.
   */
  export type ChannelOnErrorCallback = (reason: unknown) => void;
  /**
   * Tipo de dato personalizado para channelbinding.
   */
  export type ChannelBinding = {
    event: string;
    ref: number;
    callback: ChannelBindingCallback;
  };
  /**
   * Tipo de dato personalizado para channelonmessage.
   */
  export type ChannelOnMessage = (
    event: string,
    payload?: unknown,
    ref?: string | null,
    joinRef?: string | null,
  ) => unknown;
  /**
   * Tipo de dato personalizado para channelfilterbindings.
   */
  export type ChannelFilterBindings = (
    binding: ChannelBinding,
    payload: unknown,
    ref?: string | null,
  ) => boolean;
  /**
   * Tipo de dato personalizado para socketstate.
   */
  export type SocketState = string;
  /**
   * Tipo de dato personalizado para channelstate.
   */
  export type ChannelState = string;
  /**
   * Tipo de dato personalizado para channelevent.
   */
  export type ChannelEvent = string;
  /**
   * Tipo de dato personalizado para transport.
   */
  export type Transport = string;
  /**
   * Tipo de dato personalizado para xhrstate.
   */
  export type XhrState = number;
  /**
   * Tipo de dato personalizado para presenceevents.
   */
  export type PresenceEvents = { state: string; diff: string };
  /**
   * Tipo de dato personalizado para presenceonjoin.
   */
  export type PresenceOnJoin = (
    key: string,
    currentPresence: PresenceState,
    newPresence: PresenceState,
  ) => void;
  /**
   * Tipo de dato personalizado para presenceonleave.
   */
  export type PresenceOnLeave = (
    key: string,
    currentPresence: PresenceState,
    leftPresence: PresenceState,
  ) => void;
  /**
   * Tipo de dato personalizado para presenceonsync.
   */
  export type PresenceOnSync = () => void;
  /**
   * Tipo de dato personalizado para presencediff.
   */
  export type PresenceDiff = { joins: PresenceState; leaves: PresenceState };
  /**
   * Tipo de dato personalizado para presencestate.
   */
  export type PresenceState = {
    metas: { phx_ref?: string; phx_ref_prev?: string; [key: string]: unknown }[];
  };
  /**
   * Tipo de dato personalizado para presenceoptions.
   */
  export type PresenceOptions = { events?: PresenceEvents | undefined };
  /**
   * Tipo de dato personalizado para un mensaje de chat.
   */
  export type Message<T> = {
    join_ref?: string | null;
    ref?: string | null;
    event: string;
    topic: string;
    payload: T;
  };
  /**
   * Tipo de dato personalizado para encode.
   */
  export type Encode<T> = (
    msg: Message<Record<string, unknown>>,
    callback: (result: ArrayBuffer | string) => T,
  ) => T;
  /**
   * Tipo de dato personalizado para decode.
   */
  export type Decode<T> = (
    rawPayload: ArrayBuffer | string,
    callback: (msg: Message<unknown>) => T,
  ) => T;
  /**
   * Tipo de dato personalizado para heartbeatstatus.
   */
  export type HeartbeatStatus = 'sent' | 'ok' | 'error' | 'timeout' | 'disconnected';
  /**
   * Tipo de dato personalizado para heartbeatcallback.
   */
  export type HeartbeatCallback = (status: HeartbeatStatus, latency?: number) => void;
}
