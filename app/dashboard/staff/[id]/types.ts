export type StaffMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  locationId: string;
  isActive: boolean;
  location: { id: string; name: string } | null;
};

export const SKILL_LEVELS = ["junior", "stylist", "senior", "master"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];
