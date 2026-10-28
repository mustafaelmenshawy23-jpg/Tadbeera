/**
 * ========================================================
 * Tedbeera Egypt (تدبيرة مصر) — Phase 4D
 * Rewarded Ad Service Abstraction
 * ========================================================
 * Provides a modular, platform-agnostic rewarded video ad service.
 * Supports:
 * 1. Native Capacitor AdMob plugin (when running on Android device)
 * 2. Web Preview Simulator (for testing inside browser/sandbox)
 * 
 * OFFICIAL GOOGLE TEST REWARDED AD UNIT:
 * Unit ID: "ca-app-pub-3940256099942544/5224354917"
 * NOTE: For development and testing ONLY. Never use as production monetization.
 */

export const OFFICIAL_TEST_REWARDED_AD_UNIT = 'ca-app-pub-3940256099942544/5224354917';

export interface AdReward {
  type: string;
  amount: number;
}

export interface RewardedAdCallbacks {
  /** Called when user finishes watching the ad and earns the reward */
  onUserEarnedReward: (reward: AdReward) => void;
  /** Called when ad is dismissed or closed without completing */
  onDismissedWithoutReward: () => void;
  /** Called when ad loading or presentation fails */
  onError: (error: string) => void;
  /** Optional callback when ad opens */
  onAdOpened?: () => void;
}

export interface RewardedAdService {
  /** Check if currently running in native Capacitor environment */
  isNative(): boolean;
  /** Get configured test ad unit ID */
  getAdUnitId(): string;
  /** Pre-loads or prepares a rewarded video ad */
  prepareAd(): Promise<boolean>;
  /** Check if a rewarded video ad is ready for presentation */
  isReady(): boolean;
  /** Shows the rewarded ad or triggers simulation */
  show(callbacks: RewardedAdCallbacks): Promise<void>;
  /** Cleans up resources, listeners, and resets pending state */
  cleanup(): void;
}

// --------------------------------------------------------
// NATIVE CAPACITOR ADAPTER
// --------------------------------------------------------
class CapacitorNativeRewardedAdAdapter implements RewardedAdService {
  private adUnitId = OFFICIAL_TEST_REWARDED_AD_UNIT;
  private isAdLoaded = false;
  private listeners: any[] = [];
  private activeCallbacks: RewardedAdCallbacks | null = null;

  isNative(): boolean {
    return true;
  }

  getAdUnitId(): string {
    return this.adUnitId;
  }

  async prepareAd(): Promise<boolean> {
    try {
      const capacitor = (window as any).Capacitor;
      const AdMob = capacitor?.Plugins?.AdMob;
      if (!AdMob) {
        this.isAdLoaded = false;
        return false;
      }

      await AdMob.prepareRewardVideoAd({
        adId: this.adUnitId,
        isTesting: true
      });
      this.isAdLoaded = true;
      return true;
    } catch (err: any) {
      this.isAdLoaded = false;
      return false;
    }
  }

  isReady(): boolean {
    return this.isAdLoaded;
  }

  async show(callbacks: RewardedAdCallbacks): Promise<void> {
    this.activeCallbacks = callbacks;
    try {
      const capacitor = (window as any).Capacitor;
      const AdMob = capacitor?.Plugins?.AdMob;
      if (!AdMob) {
        callbacks.onError('إضافة AdMob غير متوفرة في بيئة التشغيل الحالية.');
        return;
      }

      // Cleanup prior listeners
      this.cleanupListeners();

      let rewardEarned = false;

      const rewardSub = await AdMob.addListener('rewardVideoAdRewardEarned', (info: any) => {
        rewardEarned = true;
        this.activeCallbacks?.onUserEarnedReward({
          type: info?.type || 'unlock_plan',
          amount: info?.amount || 1
        });
      });
      this.listeners.push(rewardSub);

      const dismissSub = await AdMob.addListener('rewardVideoAdDismissed', () => {
        if (!rewardEarned) {
          this.activeCallbacks?.onDismissedWithoutReward();
        }
        this.isAdLoaded = false;
        this.cleanupListeners();
      });
      this.listeners.push(dismissSub);

      const failSub = await AdMob.addListener('rewardVideoAdFailedToLoad', (err: any) => {
        this.activeCallbacks?.onError(err?.message || 'فشل تحميل إعلان المكافأة.');
        this.cleanupListeners();
      });
      this.listeners.push(failSub);

      callbacks.onAdOpened?.();
      await AdMob.showRewardVideoAd();
    } catch (err: any) {
      callbacks.onError(err?.message || 'حدث خطأ أثناء عرض إعلان المكافأة.');
      this.cleanupListeners();
    }
  }

  private cleanupListeners(): void {
    try {
      this.listeners.forEach(sub => {
        if (typeof sub?.remove === 'function') {
          sub.remove();
        }
      });
    } catch {
      // safe fallback
    }
    this.listeners = [];
  }

  cleanup(): void {
    this.cleanupListeners();
    this.isAdLoaded = false;
    this.activeCallbacks = null;
  }
}

// --------------------------------------------------------
// WEB PREVIEW SIMULATION ADAPTER
// --------------------------------------------------------
class WebPreviewRewardedAdAdapter implements RewardedAdService {
  private adUnitId = OFFICIAL_TEST_REWARDED_AD_UNIT;
  private isPrepared = true;
  private activeCallbacks: RewardedAdCallbacks | null = null;

  isNative(): boolean {
    return false;
  }

  getAdUnitId(): string {
    return this.adUnitId;
  }

  async prepareAd(): Promise<boolean> {
    // In web preview, simulation is always prepared and responsive
    this.isPrepared = true;
    return true;
  }

  isReady(): boolean {
    return this.isPrepared;
  }

  async show(callbacks: RewardedAdCallbacks): Promise<void> {
    this.activeCallbacks = callbacks;
    // Notify open
    callbacks.onAdOpened?.();
    // Dispatch custom event to let App.tsx render the Arabic simulation modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tedbeera_open_reward_simulation', {
          detail: {
            testAdUnit: this.adUnitId,
            featureName: 'خطة وجبات الأسبوع التوفيرية الكاملة مع جدول التسوق المجمع'
          }
        })
      );
    }
  }

  /**
   * Called by the Web Simulation Dialog when user explicitly completes watching.
   */
  completeSimulation(): void {
    if (this.activeCallbacks) {
      this.activeCallbacks.onUserEarnedReward({
        type: 'weekly_plan_unlock',
        amount: 1
      });
      this.activeCallbacks = null;
    }
  }

  /**
   * Called by the Web Simulation Dialog when user cancels or dismisses early.
   */
  cancelSimulation(): void {
    if (this.activeCallbacks) {
      this.activeCallbacks.onDismissedWithoutReward();
      this.activeCallbacks = null;
    }
  }

  cleanup(): void {
    this.activeCallbacks = null;
    this.isPrepared = true;
  }
}

// --------------------------------------------------------
// SINGLETON INSTANTIATION & FACTORY
// --------------------------------------------------------
let cachedService: RewardedAdService | null = null;
let webSimulationAdapterInstance: WebPreviewRewardedAdAdapter | null = null;

export function getRewardedAdService(): RewardedAdService {
  if (cachedService) return cachedService;

  const isCapacitorAvailable =
    typeof window !== 'undefined' &&
    Boolean((window as any).Capacitor?.isPluginAvailable?.('AdMob'));

  if (isCapacitorAvailable) {
    cachedService = new CapacitorNativeRewardedAdAdapter();
  } else {
    webSimulationAdapterInstance = new WebPreviewRewardedAdAdapter();
    cachedService = webSimulationAdapterInstance;
  }

  return cachedService;
}

/**
 * Accessor for the web simulation adapter so the simulation dialog can notify completion/dismissal
 */
export function getWebSimulationAdapter(): WebPreviewRewardedAdAdapter | null {
  if (!webSimulationAdapterInstance) {
    const service = getRewardedAdService();
    if (!service.isNative()) {
      webSimulationAdapterInstance = service as WebPreviewRewardedAdAdapter;
    }
  }
  return webSimulationAdapterInstance;
}
