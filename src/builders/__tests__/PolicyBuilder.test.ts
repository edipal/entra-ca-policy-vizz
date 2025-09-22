import { Policy, RiskLevel, DevicePlatform, BuiltInGrantControl, ClientAppType, PersistentBrowserMode, CloudAppSecurityType, SignInFrequencyType, SignInFrequencyAuthenticationType, SignInFrequencyInterval, GuestOrExternalUserType, ConditionalAccessPolicyState } from "@/types/Policy";
import { fromCSVRow, COLLECTION_SPLIT_CHAR, COLUMN_MAP } from "@/builders/PolicyBuilder";


describe('fromCSVRow', () => {
  it('should map top-level fields', () => {
    const row = {
      [COLUMN_MAP["id"]]: '123',
      [COLUMN_MAP["displayName"]]: 'Test Policy',
      [COLUMN_MAP["createdDateTime"]]: '2024-01-01T00:00:00Z',
      [COLUMN_MAP["modifiedDateTime"]]: '2024-01-02T00:00:00Z',
      [COLUMN_MAP["state"]]: 'enabled',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.id).toBe('123');
    expect(result.displayName).toBe('Test Policy');
    expect(result.createdDateTime).toBe('2024-01-01T00:00:00Z');
    expect(result.modifiedDateTime).toBe('2024-01-02T00:00:00Z');
    expect(result.state).toBe(ConditionalAccessPolicyState.Enabled);
  });

  it('should map all array fields', () => {
    const row = {
      [COLUMN_MAP["conditions.userRiskLevels"]]: `high${COLLECTION_SPLIT_CHAR}low`,
      [COLUMN_MAP["conditions.signInRiskLevels"]]: `medium${COLLECTION_SPLIT_CHAR}none`,
      [COLUMN_MAP["conditions.clientAppTypes"]]: 'browser',
      [COLUMN_MAP["conditions.servicePrincipalRiskLevels"]]: '',
      [COLUMN_MAP["conditions.applications.includeApplications"]]: 'app1',
      [COLUMN_MAP["conditions.applications.excludeApplications"]]: '',
      [COLUMN_MAP["conditions.applications.includeUserActions"]]: 'urn:user:registersecurityinfo',
      [COLUMN_MAP["conditions.applications.includeAuthenticationContextClassReferences"]]: '',
      [COLUMN_MAP["conditions.users.includeUsers"]]: 'user1',
      [COLUMN_MAP["conditions.users.excludeUsers"]]: '',
      [COLUMN_MAP["conditions.users.includeGroups"]]: 'group1',
      [COLUMN_MAP["conditions.users.excludeGroups"]]: '',
      [COLUMN_MAP["conditions.users.includeRoles"]]: 'role1',
      [COLUMN_MAP["conditions.users.excludeRoles"]]: '',
      [COLUMN_MAP["conditions.platforms.includePlatforms"]]: 'windows',
      [COLUMN_MAP["conditions.platforms.excludePlatforms"]]: '',
      [COLUMN_MAP["conditions.locations.includeLocations"]]: 'loc1',
      [COLUMN_MAP["conditions.locations.excludeLocations"]]: '',
      [COLUMN_MAP["conditions.clientApplications.includeServicePrincipals"]]: 'sp1',
      [COLUMN_MAP["conditions.clientApplications.excludeServicePrincipals"]]: '',
      [COLUMN_MAP["conditions.authenticationFlows.transferMethods"]]: 'deviceCodeFlow',
      [COLUMN_MAP["grantControls.builtInControls"]]: 'mfa',
      [COLUMN_MAP["grantControls.customAuthenticationFactors"]]: '',
      [COLUMN_MAP["grantControls.termsOfUse"]]: 'terms1',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.conditions.userRiskLevels).toEqual([RiskLevel.High, RiskLevel.Low]);
    expect(result.conditions.signInRiskLevels).toEqual([RiskLevel.Medium, RiskLevel.None]);
    expect(result.conditions.clientAppTypes).toEqual([ClientAppType.Browser]);
    expect(result.conditions.servicePrincipalRiskLevels).toEqual([]);
    expect(result.conditions.applications.includeApplications).toEqual(['app1']);
    expect(result.conditions.applications.excludeApplications).toEqual([]);
    expect(result.conditions.applications.includeUserActions).toEqual(['urn:user:registersecurityinfo']);
    expect(result.conditions.applications.includeAuthenticationContextClassReferences).toEqual([]);
    expect(result.conditions.users.includeUsers).toEqual(['user1']);
    expect(result.conditions.users.excludeUsers).toEqual([]);
    expect(result.conditions.users.includeGroups).toEqual(['group1']);
    expect(result.conditions.users.excludeGroups).toEqual([]);
    expect(result.conditions.users.includeRoles).toEqual(['role1']);
    expect(result.conditions.users.excludeRoles).toEqual([]);
    expect(result.conditions.platforms.includePlatforms).toEqual([DevicePlatform.Windows]);
    expect(result.conditions.platforms.excludePlatforms).toEqual([]);
    expect(result.conditions.locations.includeLocations).toEqual(['loc1']);
    expect(result.conditions.locations.excludeLocations).toEqual([]);
    expect(result.conditions.clientApplications.includeServicePrincipals).toEqual(['sp1']);
    expect(result.conditions.clientApplications.excludeServicePrincipals).toEqual([]);
    expect(result.conditions.authenticationFlows).toEqual(['deviceCodeFlow']);
    expect(result.grantControls.builtInControls).toEqual([BuiltInGrantControl.Mfa]);
    expect(result.grantControls.customAuthenticationFactors).toEqual([]);
    expect(result.grantControls.termsOfUse).toEqual(['terms1']);
  });

  it('should map boolean and number fields, and keep empty as undefined', () => {
    const row = {
      [COLUMN_MAP["sessionControls.disableResilienceDefaults"]]: '',
      [COLUMN_MAP["sessionControls.applicationEnforcedRestrictions.isEnabled"]]: 'true',
      [COLUMN_MAP["sessionControls.cloudAppSecurity.cloudAppSecurityType"]]: 'blockDownloads',
      [COLUMN_MAP["sessionControls.signInFrequency.value"]]: '5',
      [COLUMN_MAP["sessionControls.signInFrequency.type"]]: 'days',
      [COLUMN_MAP["sessionControls.signInFrequency.authenticationType"]]: 'primaryAndSecondaryAuthentication',
      [COLUMN_MAP["sessionControls.signInFrequency.frequencyInterval"]]: 'timeBased',
      [COLUMN_MAP["sessionControls.persistentBrowser.mode"]]: 'always',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.sessionControls.disableResilienceDefaults).toBeUndefined();
    expect(result.sessionControls.cloudAppSecurity).toBeDefined();
    if (result.sessionControls.cloudAppSecurity) {
      expect(result.sessionControls.cloudAppSecurity).toBe(CloudAppSecurityType.BlockDownloads);
    }
    expect(result.sessionControls.signInFrequency).toBeDefined();
    if (result.sessionControls.signInFrequency) {
      expect(result.sessionControls.signInFrequency.value).toBe(5);
      expect(result.sessionControls.signInFrequency.type).toBe(SignInFrequencyType.Days);
      expect(result.sessionControls.signInFrequency.authenticationType).toBe(SignInFrequencyAuthenticationType.PrimaryAndSecondaryAuthentication);
      expect(result.sessionControls.signInFrequency.frequencyInterval).toBe(SignInFrequencyInterval.TimeBased);
    }
    expect(result.sessionControls.persistentBrowser).toBeDefined();
    if (result.sessionControls.persistentBrowser) {
      expect(result.sessionControls.persistentBrowser).toBe(PersistentBrowserMode.Always);
    }
  });

  it('should keep filter as string or undefined', () => {
    const row = {
      [COLUMN_MAP["conditions.devices.deviceFilter.mode"]]: 'include',
      [COLUMN_MAP["conditions.devices.deviceFilter.rule"]]: 'simple string',
      [COLUMN_MAP["conditions.applications.applicationFilter.mode"]]: 'include',
      [COLUMN_MAP["conditions.applications.applicationFilter.rule"]]: 'another string',
      [COLUMN_MAP["conditions.clientApplications.servicePrincipalFilter.mode"]]: 'exclude',
      [COLUMN_MAP["conditions.clientApplications.servicePrincipalFilter.rule"]]: 'spfilter',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.conditions.devices.deviceFilter.mode).toBe('include');
    expect(result.conditions.devices.deviceFilter.rule).toBe('simple string');
    expect(result.conditions.applications.applicationFilter.mode).toBe('include');
    expect(result.conditions.applications.applicationFilter.rule).toBe('another string');
    expect(result.conditions.clientApplications.servicePrincipalFilter.mode).toBe('exclude');
    expect(result.conditions.clientApplications.servicePrincipalFilter.rule).toBe('spfilter');
  });

  it('should map grantControls.operator and leave authenticationStrength undefined if not present', () => {
    const row = {
      [COLUMN_MAP["grantControls.operator"]]: 'AND',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.grantControls.operator).toBe('AND');
    expect(result.grantControls.authenticationStrength).toBeUndefined();
  });

  it('should parse guestOrExternalUserTypes as GuestOrExternalUserType enum values', () => {
    const row = {
      [COLUMN_MAP["conditions.users.includeGuestsOrExternalUsers.externalTenants.members"]]: `tenantA,tenantB`,
      [COLUMN_MAP["conditions.users.includeGuestsOrExternalUsers.guestOrExternalUserTypes"]]: `${GuestOrExternalUserType.B2BCollaborationGuest},${GuestOrExternalUserType.B2BCollaborationMember}`,
      [COLUMN_MAP["conditions.users.excludeGuestsOrExternalUsers.externalTenants.members"]]: `tenantC`,
      [COLUMN_MAP["conditions.users.excludeGuestsOrExternalUsers.guestOrExternalUserTypes"]]: `${GuestOrExternalUserType.InternalGuest}`,
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.conditions.users.includeGuestsOrExternalUsers).toEqual({
      guestOrExternalUserTypes: [GuestOrExternalUserType.B2BCollaborationGuest, GuestOrExternalUserType.B2BCollaborationMember],
      externalTenants: ['tenantA', 'tenantB']
    });
    expect(result.conditions.users.excludeGuestsOrExternalUsers).toEqual({
      guestOrExternalUserTypes: [GuestOrExternalUserType.InternalGuest],
      externalTenants: ['tenantC']
    });
  });

  it('should handle empty and missing fields gracefully', () => {
    const row = {};
    const result = fromCSVRow(row) as Policy;
    expect(result.id).toBeUndefined();
    expect(result.displayName).toBeUndefined();
    expect(result.conditions).toBeDefined();
    expect(result.conditions.applications.includeApplications).toEqual([]);
    expect(result.conditions.users.includeUsers).toEqual([]);
    expect(result.conditions.platforms.includePlatforms).toEqual([]);
    expect(result.conditions.users.includeGuestsOrExternalUsers?.guestOrExternalUserTypes).toEqual([]);
    expect(result.grantControls.builtInControls).toEqual([]);
    expect(result.sessionControls).toBeDefined();
  });

  it('should ignore unknown/extra fields', () => {
    const row = {
      [COLUMN_MAP["id"]]: 'id',
      UnknownField: 'should be ignored',
      [COLUMN_MAP["conditions.applications.includeApplications"]]: 'app1',
      ExtraField: 'extra',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.id).toBe('id');
    expect(result.conditions.applications.includeApplications).toEqual(['app1']);
    expect(Object.prototype.hasOwnProperty.call(result, 'UnknownField')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'ExtraField')).toBe(false);
  });

  it('should handle invalid enum values gracefully', () => {
    const row = {
      [COLUMN_MAP["state"]]: 'notAValidState',
      [COLUMN_MAP["conditions.userRiskLevels"]]: 'notAValidRisk,high',
      [COLUMN_MAP["conditions.platforms.includePlatforms"]]: 'notAPlatform,windows',
      [COLUMN_MAP["grantControls.builtInControls"]]: 'notAControl,mfa',
    };
    const result = fromCSVRow(row) as Policy;
    // Invalid enums will be filtered out, so state will be undefined and arrays will only include valid enums
    expect(result.state).toBeUndefined();
    expect(result.conditions.userRiskLevels).toEqual([RiskLevel.High]);
    expect(result.conditions.platforms.includePlatforms).toEqual([DevicePlatform.Windows]);
    expect(result.grantControls.builtInControls).toEqual([BuiltInGrantControl.Mfa]);
  });

  it('should handle partial/optional nested objects', () => {
    const row = {
      [COLUMN_MAP["conditions.users.includeGuestsOrExternalUsers.guestOrExternalUserTypes"]]: `${GuestOrExternalUserType.InternalGuest}`,
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.conditions.users.includeGuestsOrExternalUsers).toEqual({
      externalTenants: [],
      guestOrExternalUserTypes: [GuestOrExternalUserType.InternalGuest],
    });
  });
});
