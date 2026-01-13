import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faGoogle,
  faMicrosoft,
  faYahoo,
  faApple,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faServer } from '@fortawesome/free-solid-svg-icons';

export interface EmailProviderPreset {
  id: string;
  name: string;
  icon: IconDefinition;
  iconColor?: string;
  imap: {
    host: string;
    port: number;
    useSsl: boolean;
  };
  smtp: {
    host: string;
    port: number;
    useSsl: boolean;
  };
  instructions: string;
  commonImapPorts: number[];
  commonSmtpPorts: number[];
}

export const EMAIL_PROVIDERS: EmailProviderPreset[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: faGoogle,
    iconColor: '#EA4335',
    imap: {
      host: 'imap.gmail.com',
      port: 993,
      useSsl: true,
    },
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      useSsl: false,
    },
    instructions:
      'Enable IMAP in Gmail settings (Settings → See all settings → Forwarding and POP/IMAP). Use an App Password if 2FA is enabled (Google Account → Security → App passwords).',
    commonImapPorts: [993],
    commonSmtpPorts: [587, 465],
  },
  {
    id: 'outlook',
    name: 'Outlook / Microsoft 365',
    icon: faMicrosoft,
    iconColor: '#0078D4',
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      useSsl: true,
    },
    smtp: {
      host: 'smtp.office365.com',
      port: 587,
      useSsl: false,
    },
    instructions:
      'Use your Microsoft account credentials. For Microsoft 365 accounts, you may need to enable IMAP in the admin center. Enable 2FA and create an App Password if required.',
    commonImapPorts: [993],
    commonSmtpPorts: [587],
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    icon: faYahoo,
    iconColor: '#6001D2',
    imap: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      useSsl: true,
    },
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      useSsl: false,
    },
    instructions:
      'Generate an App Password: Account Info → Account Security → App password. Allow apps with less secure access or use OAuth.',
    commonImapPorts: [993],
    commonSmtpPorts: [587, 465],
  },
  {
    id: 'icloud',
    name: 'iCloud Mail',
    icon: faApple,
    iconColor: '#000000',
    imap: {
      host: 'imap.mail.me.com',
      port: 993,
      useSsl: true,
    },
    smtp: {
      host: 'smtp.mail.me.com',
      port: 587,
      useSsl: false,
    },
    instructions:
      'Enable Mail in iCloud settings. Generate an app-specific password at appleid.apple.com → Security → App-Specific Passwords.',
    commonImapPorts: [993],
    commonSmtpPorts: [587],
  },
  {
    id: 'zoho',
    name: 'Zoho Mail',
    icon: faEnvelope,
    iconColor: '#C8202B',
    imap: {
      host: 'imap.zoho.com',
      port: 993,
      useSsl: true,
    },
    smtp: {
      host: 'smtp.zoho.com',
      port: 587,
      useSsl: false,
    },
    instructions:
      'Enable IMAP in Zoho Mail settings (Settings → Mail → IMAP Access). Use your Zoho credentials.',
    commonImapPorts: [993],
    commonSmtpPorts: [587, 465],
  },
  {
    id: 'protonmail',
    name: 'ProtonMail',
    icon: faEnvelope,
    iconColor: '#6D4AFF',
    imap: {
      host: '127.0.0.1',
      port: 1143,
      useSsl: false,
    },
    smtp: {
      host: '127.0.0.1',
      port: 1025,
      useSsl: false,
    },
    instructions:
      'ProtonMail requires the ProtonMail Bridge app for IMAP/SMTP access. Install and run Bridge, then use localhost with the ports and password provided by Bridge.',
    commonImapPorts: [1143],
    commonSmtpPorts: [1025],
  },
  {
    id: 'fastmail',
    name: 'Fastmail',
    icon: faEnvelope,
    iconColor: '#69A4E0',
    imap: {
      host: 'imap.fastmail.com',
      port: 993,
      useSsl: true,
    },
    smtp: {
      host: 'smtp.fastmail.com',
      port: 587,
      useSsl: false,
    },
    instructions:
      'Go to Settings → Password & Security and create an App Password. IMAP is enabled by default.',
    commonImapPorts: [993],
    commonSmtpPorts: [587, 465],
  },
  {
    id: 'custom',
    name: 'Custom / Other',
    icon: faServer,
    iconColor: '#6c757d',
    imap: {
      host: '',
      port: 993,
      useSsl: true,
    },
    smtp: {
      host: '',
      port: 587,
      useSsl: false,
    },
    instructions:
      'Enter your email server settings manually. Contact your email provider for the correct IMAP and SMTP server addresses and ports.',
    commonImapPorts: [993, 143],
    commonSmtpPorts: [587, 465, 25],
  },
];

// Common port options
export const IMAP_PORTS = [993, 143];
export const SMTP_PORTS = [587, 465, 25];

// Get provider by host matching
export function getProviderByHost(host: string): EmailProviderPreset | null {
  const hostLower = host.toLowerCase();

  for (const provider of EMAIL_PROVIDERS) {
    if (provider.id === 'custom') continue;

    if (
      hostLower.includes(provider.imap.host.toLowerCase()) ||
      hostLower.includes(provider.smtp.host.toLowerCase())
    ) {
      return provider;
    }

    // Additional host pattern matching
    if (provider.id === 'gmail' && hostLower.includes('gmail')) {
      return provider;
    }
    if (
      provider.id === 'outlook' &&
      (hostLower.includes('outlook') || hostLower.includes('office365'))
    ) {
      return provider;
    }
    if (provider.id === 'yahoo' && hostLower.includes('yahoo')) {
      return provider;
    }
    if (
      provider.id === 'icloud' &&
      (hostLower.includes('icloud') || hostLower.includes('me.com'))
    ) {
      return provider;
    }
    if (provider.id === 'zoho' && hostLower.includes('zoho')) {
      return provider;
    }
    if (provider.id === 'protonmail' && hostLower.includes('proton')) {
      return provider;
    }
    if (provider.id === 'fastmail' && hostLower.includes('fastmail')) {
      return provider;
    }
  }

  return null;
}

export function getProviderById(id: string): EmailProviderPreset | undefined {
  return EMAIL_PROVIDERS.find((p) => p.id === id);
}
