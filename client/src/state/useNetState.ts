import { useSyncExternalStore } from "react";
import { connection, type NetState } from "../net/connection";

export function useNetState(): NetState {
  return useSyncExternalStore(connection.subscribe, connection.getState);
}
