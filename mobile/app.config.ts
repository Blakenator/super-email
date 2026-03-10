import { ExpoConfig, ConfigContext } from "expo/config";

const { version } = require("./package.json");

const IS_DEV = process.env.APP_VARIANT === "development";

const getAppName = () => (IS_DEV ? "SuperMail (Dev)" : "SuperMail");

const getBundleId = () =>
  IS_DEV
    ? "com.stacksindustries.supermail.dev"
    : "com.stacksindustries.supermail";

const getIcon = () => (IS_DEV ? "./assets/icon-dev.png" : "./assets/icon.png");

const getAdaptiveIcon = () =>
  IS_DEV ? "./assets/adaptive-icon-dev.png" : "./assets/adaptive-icon.png";

const getNotificationIcon = () =>
  IS_DEV
    ? "./assets/notification-icon-dev.png"
    : "./assets/notification-icon.png";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "supermail",
  version,
  orientation: "portrait",
  icon: getIcon(),
  scheme: IS_DEV ? "supermail-dev" : "supermail",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#667eea",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleId(),
    infoPlist: {
      NSFaceIDUsageDescription:
        "Use Face ID to unlock SuperMail and access your emails securely.",
      NSCameraUsageDescription:
        "Camera access is needed to scan documents and attach photos to emails.",
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: getAdaptiveIcon(),
      backgroundColor: "#667eea",
    },
    package: getBundleId(),
    googleServicesFile: "./google-services.json",
    permissions: [
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "CAMERA",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
    ],
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "Allow SuperMail to use Face ID for secure authentication.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: getNotificationIcon(),
        color: "#667eea",
      },
    ],
    "./plugins/withMailtoHandler",
  ],
  extra: {
    eas: {
      projectId: "eadf115d-0381-41de-b2cf-95110a04e92a",
    },
  },
  owner: "blakenator",
});
