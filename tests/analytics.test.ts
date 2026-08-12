import { trackPageview } from "../src/_common/lib/analytics";

const CONFIG = { key: "pa_0123456789abcdef01234567", host: "https://stats.example" };

const setLocation = (href: string) => {
  delete (window as any).location;
  (window as any).location = new URL(href) as any;
};

// jsdom's Blob has no text(); FileReader is the portable way to read one.
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

describe("analytics beacon", () => {
  beforeEach(() => {
    (window as any).PRSSAnalytics = { ...CONFIG };
    (navigator as any).sendBeacon = jest.fn(() => true);
    (navigator as any).doNotTrack = undefined;
    (navigator as any).globalPrivacyControl = undefined;
    (window as any).doNotTrack = undefined;
    setLocation("https://example.com/blog/post/");
    Object.defineProperty(document, "referrer", { value: "", configurable: true });
  });

  it("does nothing when the site has no key", () => {
    (window as any).PRSSAnalytics = undefined;
    trackPageview();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("sends the path and referrer, and nothing else", async () => {
    Object.defineProperty(document, "referrer", {
      value: "https://news.ycombinator.com/",
      configurable: true,
    });

    trackPageview();

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = (navigator.sendBeacon as jest.Mock).mock.calls[0];
    expect(url).toBe("https://stats.example/e");

    const payload = JSON.parse(await readBlob(blob as Blob));
    expect(payload).toEqual({
      k: CONFIG.key,
      p: "/blog/post/",
      r: "https://news.ycombinator.com/",
    });
  });

  it("honours Do Not Track and Global Privacy Control", () => {
    (navigator as any).doNotTrack = "1";
    trackPageview();

    (navigator as any).doNotTrack = undefined;
    (navigator as any).globalPrivacyControl = true;
    trackPageview();

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("stays quiet on localhost", () => {
    setLocation("http://localhost:3001/blog/post/");
    trackPageview();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("never throws when the browser refuses the beacon", () => {
    (navigator as any).sendBeacon = () => {
      throw new Error("blocked");
    };
    expect(() => trackPageview()).not.toThrow();
  });
});
