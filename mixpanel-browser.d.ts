// types/mixpanel-browser.d.ts
declare module 'mixpanel-browser' {
  const mixpanel: {
    init: (token: string, config?: Record<string, unknown>) => void;
    track: (eventName: string, properties?: Record<string, unknown>) => void;
    // Add other methods as needed
  };
  export default mixpanel;
}
