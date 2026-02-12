/**
 * Shared types for assume-persona OpenCode plugin
 */

export interface SessionState {
  loadedPersonas: string[];
  lastAccess: string;
  missingAutoLoad?: string[];
}

export interface State {
  [sessionId: string]: SessionState;
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

export const PERSONA_SKILL_PREFIX = "persona-";

export interface SectionChecks {
  roleDescription: boolean;
  coreExpertise: boolean;
  mentalModels: boolean;
  bestPractices: boolean;
  pitfalls: boolean;
  tools: boolean;
}

export interface ValidationResult {
  valid: boolean;
  frontmatter: PersonaFrontmatter;
  sections: SectionChecks;
  lineCount: number;
  errors: string[];
  warnings: string[];
}
