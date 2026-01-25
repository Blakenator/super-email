// REST API exports (legacy)
export { 
  registerPushToken as registerPushTokenRest, 
  getUserPushTokens, 
  deactivatePushToken, 
  deactivateUserPushTokens,
  type RegisterPushTokenInput,
  type RegisterPushTokenResult,
} from './register.js';

// GraphQL resolvers
export { registerPushToken } from './registerPushToken.js';
export { unregisterPushToken } from './unregisterPushToken.js';
export { getPushTokens } from './getPushTokens.js';
