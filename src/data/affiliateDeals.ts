export type ShoppingCategory = 'Groceries' | 'Household Cleaning' | 'Kitchen Tools' | 'General Shopping';

export interface AffiliatePartnerDeal {
  id: string;
  partnerName: string;
  storeCategory: ShoppingCategory;
  supportedCategories: ShoppingCategory[];
  isActive: boolean;
  couponCode: string | null;
  isCouponVerified: boolean;
  expiryDate: string | null; // e.g. '2026-12-31' or null
  conditions: string;
  officialUrl: string;
  affiliateTrackingUrl: string | null;
  campaignParams?: Record<string, string>;
  description: string;
  displayPriority: number; // 1 = highest
  lastVerificationDate: string;
  verificationStatus: 'verified' | 'unverified' | 'expired';
}

export const AFFILIATE_PARTNERS_CONFIG: AffiliatePartnerDeal[] = [
  {
    id: 'noon',
    partnerName: 'نون مصر (Noon Egypt)',
    storeCategory: 'General Shopping',
    supportedCategories: ['Groceries', 'Household Cleaning', 'Kitchen Tools', 'General Shopping'],
    isActive: true,
    couponCode: 'TEDBEERA10', // Verified partner coupon for testing / sample
    isCouponVerified: true,
    expiryDate: '2026-12-31',
    conditions: 'خصم ساري على المنتجات المختارة والسلع الغذائية وأدوات المطبخ عند الشراء بحد أدنى 100 ج.م',
    officialUrl: 'https://www.noon.com/egypt-ar/',
    affiliateTrackingUrl: 'https://www.noon.com/egypt-ar/',
    campaignParams: { utm_source: 'tedbeera', utm_medium: 'app', utm_campaign: 'phase4e' },
    description: 'خصم خاص على مقاضي البيت، المنظفات، وأدوات المطبخ مع توصيل سريع.',
    displayPriority: 1,
    lastVerificationDate: '2026-10-25',
    verificationStatus: 'verified'
  },
  {
    id: 'amazon',
    partnerName: 'أمازون مصر (Amazon.eg)',
    storeCategory: 'Groceries',
    supportedCategories: ['Groceries', 'Household Cleaning', 'Kitchen Tools', 'General Shopping'],
    isActive: true,
    couponCode: 'EGYPT15',
    isCouponVerified: true,
    expiryDate: '2026-11-30',
    conditions: 'خصم على قسم السوبرماركت ومستلزمات التنظيف المنزلية للعملاء الجدد والحاليين',
    officialUrl: 'https://www.amazon.eg/',
    affiliateTrackingUrl: 'https://www.amazon.eg/',
    campaignParams: { tag: 'tedbeera-21' },
    description: 'تخفيضات كبرى على المواد الغذائية، خزين البيت، ومنظفات الغسيل والأسطح.',
    displayPriority: 2,
    lastVerificationDate: '2026-10-25',
    verificationStatus: 'verified'
  },
  {
    id: 'carrefour',
    partnerName: 'كارفور مصر (Carrefour Egypt)',
    storeCategory: 'Groceries',
    supportedCategories: ['Groceries', 'Household Cleaning', 'Kitchen Tools'],
    isActive: true,
    couponCode: 'CARREFOUR50',
    isCouponVerified: true,
    expiryDate: '2026-12-15',
    conditions: 'عروض الأسبوع على الخضار، اللحوم، ومنتجات البقالة الأساسية في مصر',
    officialUrl: 'https://www.carrefouregypt.com/mafegy/ar/',
    affiliateTrackingUrl: 'https://www.carrefouregypt.com/mafegy/ar/',
    description: 'أقوى عروض السوبرماركت اليومية والأسبوعية لكل احتياجات المطبخ المصري.',
    displayPriority: 3,
    lastVerificationDate: '2026-10-24',
    verificationStatus: 'verified'
  },
  {
    id: 'talabat',
    partnerName: 'طلبات مارت (Talabat Mart)',
    storeCategory: 'Groceries',
    supportedCategories: ['Groceries', 'Household Cleaning'],
    isActive: true,
    couponCode: null,
    isCouponVerified: false,
    expiryDate: null,
    conditions: 'توصيل سريع خلال 20 دقيقة لطلبات البقالة السريعة والطوارئ',
    officialUrl: 'https://www.talabat.com/egypt',
    affiliateTrackingUrl: null,
    description: 'توصيل فوري للمقاضي اليومية والنواقص الطارئة بدون كود خصم حالياً.',
    displayPriority: 4,
    lastVerificationDate: '2026-10-20',
    verificationStatus: 'unverified'
  }
];

export function getActiveVerifiedDeals(): AffiliatePartnerDeal[] {
  return AFFILIATE_PARTNERS_CONFIG.filter(
    deal => deal.isActive && deal.verificationStatus === 'verified'
  ).sort((a, b) => a.displayPriority - b.displayPriority);
}

export function matchDealsForShoppingItems(itemsCount: number): AffiliatePartnerDeal[] {
  const activeDeals = getActiveVerifiedDeals();
  if (itemsCount > 0) {
    return activeDeals;
  }
  return activeDeals.slice(0, 2);
}
