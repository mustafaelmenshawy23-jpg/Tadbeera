import { createLocalRepository } from '../../services/localDataRepository';
import { DEFAULT_HOUSEHOLD_PROFILE, isHouseholdProfile, type HouseholdProfile } from './householdModels';

export const HOUSEHOLD_PROFILE_STORAGE_KEY = 'tedbeera_household_profile_v1';

export const householdProfileRepository = createLocalRepository<HouseholdProfile>(
  HOUSEHOLD_PROFILE_STORAGE_KEY,
  DEFAULT_HOUSEHOLD_PROFILE,
  isHouseholdProfile
);
