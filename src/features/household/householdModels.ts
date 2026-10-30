import { APP_CURRENCY, APP_LOCALE } from '../../services/localDataRepository';

export interface HouseholdProfile {
  name: string;
  familySize: number;
  governorate: string;
  city: string;
  currency: typeof APP_CURRENCY;
  locale: typeof APP_LOCALE;
  paydayDay: number | null;
  createdAt: string;
}

export const DEFAULT_HOUSEHOLD_PROFILE: HouseholdProfile = {
  name: '',
  familySize: 4,
  governorate: '',
  city: '',
  currency: APP_CURRENCY,
  locale: APP_LOCALE,
  paydayDay: null,
  createdAt: ''
};

export function isHouseholdProfile(value: unknown): value is HouseholdProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<HouseholdProfile>;
  return typeof profile.name === 'string'
    && Number.isInteger(profile.familySize) && (profile.familySize ?? 0) >= 1 && (profile.familySize ?? 0) <= 30
    && typeof profile.governorate === 'string'
    && typeof profile.city === 'string'
    && profile.currency === APP_CURRENCY
    && profile.locale === APP_LOCALE
    && (profile.paydayDay === null || (Number.isInteger(profile.paydayDay) && profile.paydayDay! >= 1 && profile.paydayDay! <= 31))
    && typeof profile.createdAt === 'string';
}
