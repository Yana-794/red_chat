import {LucideIcon} from 'lucide-react'
export enum ENavigationKey {
  Profile = "profile",
  Notifications = "notifications",
  Settings = "settings",
}

export interface ItemProfile {
    key: ENavigationKey;
    path: string;
    label: string;
    icon: LucideIcon;
    isModal?: boolean;
}
