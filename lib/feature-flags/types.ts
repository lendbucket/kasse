export type FeatureFlagChangeType =
  | 'CREATE'
  | 'UPDATE'              // catch-all for multi-field updates
  | 'UPDATE_DESCRIPTION'  // description-only changes
  | 'UPDATE_DEFAULT'
  | 'UPDATE_ROLLOUT'
  | 'UPDATE_OVERRIDE'
  | 'TOGGLE_ACTIVE'
  | 'DELETE';

export interface FeatureFlagRecord {
  id: string;
  key: string;
  description: string;
  defaultValue: boolean;
  rolloutPct: number;
  overrides: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlagEvaluationContext {
  organizationId: string | null;
  userId: string | null;
}

export interface FlagEvaluationResult {
  key: string;
  enabled: boolean;
  source: 'OVERRIDE' | 'ROLLOUT' | 'DEFAULT' | 'INACTIVE' | 'MISSING';
}
