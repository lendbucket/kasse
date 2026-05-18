export type DeviceRole =
  | "STYLIST_DEVICE"
  | "CUSTOMER_DISPLAY"
  | "MANAGER_DEVICE"
  | "STANDALONE_POS"
  | "TERMINAL";

export type PlatformOs = "iOS" | "Android" | "Web" | "Terminal";

export interface DeviceRegistration {
  organizationId: string;
  locationId: string;
  name: string;
  role: DeviceRole;
  platformOs: PlatformOs;
  platformVersion: string | null;
  payrocTerminalId: string | null;
  pairedChairId: string | null;
  isJailbroken: boolean;
  ipAddress: string | null;
}

export interface DevicePairingState {
  chairId: string;
  customerDisplayDeviceId: string | null;
  stylistDeviceId: string | null;
  terminalDeviceId: string | null;
  isComplete: boolean;
}
