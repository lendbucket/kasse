export type TagTargetEntity =
  | 'CLIENT'
  | 'SERVICE'
  | 'APPOINTMENT'
  | 'STAFF'
  | 'PRODUCT';

export const VALID_TAG_TARGET_ENTITIES: TagTargetEntity[] =
  ['CLIENT', 'SERVICE', 'APPOINTMENT', 'STAFF', 'PRODUCT'];

export const VALID_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const VALID_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
export const MAX_NAME_LENGTH = 50;
export const DEFAULT_TAG_COLOR = '#606E74';

export interface TagRecord {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  softDeletedAt: Date | null;
}

export interface EntityTagRecord {
  id: string;
  organizationId: string;
  tagId: string;
  entityType: TagTargetEntity;
  entityId: string;
  createdAt: Date;
}
