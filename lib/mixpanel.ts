// utils/mixpanel.ts
import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN: string | undefined = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export const initMixpanel = (): void => {
  if (!MIXPANEL_TOKEN) {
    console.error('Mixpanel token is not provided');
    return;
  }
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: true,
    track_pageview: true,
    autotrack: false,
    persistence: "localStorage",
  });
};

export const trackEvent = (eventName: string, properties: Record<string, unknown> = {}): void => {
  mixpanel.track(eventName, properties);
};
