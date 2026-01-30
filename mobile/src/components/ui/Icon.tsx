/**
 * Unified Icon component using @expo/vector-icons
 * Provides consistent icon usage across the app
 */

import React from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type IconName = 
  // Navigation & UI
  | 'inbox' | 'send' | 'file-text' | 'archive' | 'trash-2' | 'star'
  | 'chevron-right' | 'chevron-left' | 'chevron-down' | 'chevron-up' | 'x' | 'check'
  | 'plus' | 'minus' | 'edit-2' | 'settings' | 'search' | 'filter'
  | 'menu' | 'more-vertical' | 'more-horizontal' | 'refresh-cw'
  // Email
  | 'mail' | 'mail-open' | 'paperclip' | 'reply' | 'reply-all' | 'forward'
  | 'tag' | 'bookmark' | 'flag' | 'bell' | 'bell-off'
  // User & Contacts  
  | 'user' | 'users' | 'user-plus' | 'user-check'
  // Auth & Security
  | 'lock' | 'unlock' | 'eye' | 'eye-off' | 'fingerprint' | 'face-id'
  // Status & Actions
  | 'check-circle' | 'alert-circle' | 'info' | 'help-circle'
  | 'sun' | 'moon' | 'monitor' | 'smartphone'
  // Other
  | 'log-out' | 'external-link' | 'link' | 'copy' | 'download' | 'upload'
  | 'folder' | 'server' | 'zap' | 'shield' | 'globe' | 'clock' | 'briefcase' | 'image'
  // Formatting (for rich text editor)
  | 'format-bold' | 'format-italic' | 'format-underline'
  | 'format-list-bulleted' | 'format-list-numbered';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  focused?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
};

// Map icon names to the appropriate icon set
const ICON_MAP: Record<IconName, { set: 'feather' | 'material' | 'ionicons'; name: string }> = {
  // Navigation & UI
  inbox: { set: 'feather', name: 'inbox' },
  send: { set: 'feather', name: 'send' },
  'file-text': { set: 'feather', name: 'file-text' },
  archive: { set: 'feather', name: 'archive' },
  'trash-2': { set: 'feather', name: 'trash-2' },
  star: { set: 'feather', name: 'star' },
  'chevron-right': { set: 'feather', name: 'chevron-right' },
  'chevron-left': { set: 'feather', name: 'chevron-left' },
  'chevron-down': { set: 'feather', name: 'chevron-down' },
  'chevron-up': { set: 'feather', name: 'chevron-up' },
  x: { set: 'feather', name: 'x' },
  check: { set: 'feather', name: 'check' },
  plus: { set: 'feather', name: 'plus' },
  minus: { set: 'feather', name: 'minus' },
  'edit-2': { set: 'feather', name: 'edit-2' },
  settings: { set: 'feather', name: 'settings' },
  search: { set: 'feather', name: 'search' },
  filter: { set: 'feather', name: 'filter' },
  menu: { set: 'feather', name: 'menu' },
  'more-vertical': { set: 'feather', name: 'more-vertical' },
  'more-horizontal': { set: 'feather', name: 'more-horizontal' },
  'refresh-cw': { set: 'feather', name: 'refresh-cw' },
  // Email
  mail: { set: 'feather', name: 'mail' },
  'mail-open': { set: 'material', name: 'email-open-outline' },
  paperclip: { set: 'feather', name: 'paperclip' },
  reply: { set: 'material', name: 'reply' },
  'reply-all': { set: 'material', name: 'reply-all' },
  forward: { set: 'material', name: 'forward' },
  tag: { set: 'feather', name: 'tag' },
  bookmark: { set: 'feather', name: 'bookmark' },
  flag: { set: 'feather', name: 'flag' },
  bell: { set: 'feather', name: 'bell' },
  'bell-off': { set: 'feather', name: 'bell-off' },
  // User & Contacts
  user: { set: 'feather', name: 'user' },
  users: { set: 'feather', name: 'users' },
  'user-plus': { set: 'feather', name: 'user-plus' },
  'user-check': { set: 'feather', name: 'user-check' },
  // Auth & Security
  lock: { set: 'feather', name: 'lock' },
  unlock: { set: 'feather', name: 'unlock' },
  eye: { set: 'feather', name: 'eye' },
  'eye-off': { set: 'feather', name: 'eye-off' },
  fingerprint: { set: 'ionicons', name: 'finger-print' },
  'face-id': { set: 'material', name: 'face-recognition' },
  // Status & Actions
  'check-circle': { set: 'feather', name: 'check-circle' },
  'alert-circle': { set: 'feather', name: 'alert-circle' },
  info: { set: 'feather', name: 'info' },
  'help-circle': { set: 'feather', name: 'help-circle' },
  sun: { set: 'feather', name: 'sun' },
  moon: { set: 'feather', name: 'moon' },
  monitor: { set: 'feather', name: 'monitor' },
  smartphone: { set: 'feather', name: 'smartphone' },
  // Other
  'log-out': { set: 'feather', name: 'log-out' },
  'external-link': { set: 'feather', name: 'external-link' },
  link: { set: 'feather', name: 'link' },
  copy: { set: 'feather', name: 'copy' },
  download: { set: 'feather', name: 'download' },
  upload: { set: 'feather', name: 'upload' },
  folder: { set: 'feather', name: 'folder' },
  server: { set: 'feather', name: 'server' },
  zap: { set: 'feather', name: 'zap' },
  shield: { set: 'feather', name: 'shield' },
  globe: { set: 'feather', name: 'globe' },
  clock: { set: 'feather', name: 'clock' },
  briefcase: { set: 'feather', name: 'briefcase' },
  image: { set: 'feather', name: 'image' },
  // Formatting
  'format-bold': { set: 'material', name: 'format-bold' },
  'format-italic': { set: 'material', name: 'format-italic' },
  'format-underline': { set: 'material', name: 'format-underline' },
  'format-list-bulleted': { set: 'material', name: 'format-list-bulleted' },
  'format-list-numbered': { set: 'material', name: 'format-list-numbered' },
};

export function Icon({ name, size = 'md', color, focused }: IconProps) {
  const theme = useTheme();
  
  const resolvedSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const resolvedColor = color ?? (focused ? theme.colors.primary : theme.colors.text);
  
  const iconConfig = ICON_MAP[name];
  
  if (!iconConfig) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }
  
  switch (iconConfig.set) {
    case 'feather':
      return <Feather name={iconConfig.name as any} size={resolvedSize} color={resolvedColor} />;
    case 'material':
      return <MaterialCommunityIcons name={iconConfig.name as any} size={resolvedSize} color={resolvedColor} />;
    case 'ionicons':
      return <Ionicons name={iconConfig.name as any} size={resolvedSize} color={resolvedColor} />;
    default:
      return null;
  }
}

// Tab bar icon component helper
export function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  return <Icon name={name} size="lg" color={color} focused={focused} />;
}
