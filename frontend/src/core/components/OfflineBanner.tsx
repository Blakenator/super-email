import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';
import { useEmailStore } from '../../stores/emailStore';
import {
  OfflineBannerWrapper,
  OfflineIcon,
  OfflineText,
  OfflineBadge,
  OfflineBannerSpacer as OfflineBannerSpacerStyled,
} from './OfflineBanner.wrappers';

export function OfflineBanner() {
  const isOnline = useEmailStore((state) => state.isOnline);
  const cachedEmails = useEmailStore((state) => state.emails);
  const cachedEmailCount = Object.keys(cachedEmails).length;
  const hasCachedData = cachedEmailCount > 0;

  const showBanner = !isOnline;

  return (
    <OfflineBannerWrapper $isVisible={showBanner}>
      <OfflineIcon>
        <FontAwesomeIcon icon={faWifi} style={{ opacity: 0.8 }} />
      </OfflineIcon>
      <OfflineText>
        You're offline — viewing cached data
        {hasCachedData && (
          <OfflineBadge>{cachedEmailCount} emails cached</OfflineBadge>
        )}
      </OfflineText>
    </OfflineBannerWrapper>
  );
}

// Separate component for the spacer that should be inside AppWrapper
export function OfflineBannerSpacer() {
  const isOnline = useEmailStore((state) => state.isOnline);
  const showBanner = !isOnline;
  return <OfflineBannerSpacerStyled $isVisible={showBanner} />;
}

// Hook for components to check if they should skip network requests
export function useIsOffline() {
  const isOnline = useEmailStore((state) => state.isOnline);
  const hasCachedData = useEmailStore((state) => state.hasCachedData);

  return {
    isOffline: !isOnline,
    hasCachedData: hasCachedData(),
    shouldUseCacheOnly: !isOnline && hasCachedData(),
  };
}
