/**
 * Shared types for assume-persona OpenCode plugin
 */

export interface SessionState {
  loadedPersonas: string[];
  lastAccess: string;
}

export interface HandoffState {
  personas: string[];
  timestamp: number;
}

export interface State {
  [sessionId: string]: SessionState;
  "session-clear-handoff"?: HandoffState;
}

export interface Config {
  autoLoad?: string[];
}

export interface PersonaFrontmatter {
  archetype: string;
  created: string;
  category?: string;
  keywords?: string[];
}

export interface PersonaInfo {
  archetype: string;
  description: string;
  category: string;
  scope: "local" | "user";
  path: string;
  created: string;
  lineCount: number;
  loaded: boolean;
  autoLoad: boolean;
}

export interface ListResult {
  personas: PersonaInfo[];
  summary: {
    total: number;
    loaded: number;
    autoLoad: number;
  };
}

export interface StatusResult {
  loadedPersonas: string[];
  autoLoad: string[];
  configPath: string;
}

export const PERSONA_SKILL_PREFIX = "assume-persona--";
export const HANDOFF_KEY = "session-clear-handoff";
