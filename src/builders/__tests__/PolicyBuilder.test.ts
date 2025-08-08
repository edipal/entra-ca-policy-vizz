import { Policy, RiskLevel, DevicePlatform, BuiltInGrantControl, ClientAppType, PersistentBrowserMode, CloudAppSecurityType, SignInFrequencyType, SignInFrequencyAuthenticationType, SignInFrequencyInterval, GuestOrExternalUserType, ConditionalAccessPolicyState } from "@/types/Policy";
import { fromCSVRow, COLLECTION_SPLIT_CHAR } from "@/builders/PolicyBuilder";


describe('fromCSVRow', () => {
  it('should map top-level fields', () => {
    const row = {
      ID: '123',
      Name: 'Test Policy',
      Created: '2024-01-01T00:00:00Z',
      Modified: '2024-01-02T00:00:00Z',
      State: 'enabled',
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
      UserRiskLevels: `high${COLLECTION_SPLIT_CHAR}low`,
      SignInRiskLevels: `medium${COLLECTION_SPLIT_CHAR}none`,
      clientAppTypes: 'browser',
      ServicePrincipalRiskLevels: '',
      includeApplications: 'app1',
      excludeApplications: '',
      IncludeUserActions: 'urn:user:registersecurityinfo',
      IncludeAuthenticationContextClassReferences: '',
      IncludeUsers: 'user1',
      ExcludeUsers: '',
      includeGroups: 'group1',
      excludeGroups: '',
      IncludeRoles: 'role1',
      ExcludeRoles: '',
      IncludePlatforms: 'windows',
      ExcludePlatforms: '',
      IncludeLocations: 'loc1',
      ExcludeLocations: '',
      IncludeServicePrincipals: 'sp1',
      ExcludeServicePrincipals: '',
      transferMethods: 'deviceCodeFlow',
      BuiltInControls: 'mfa',
      CustomAuthenticationFactors: '',
      TermsOfUse: 'terms1',
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
    expect(result.conditions.authenticationFlows.transferMethods).toEqual(['deviceCodeFlow']);
    expect(result.grantControls.builtInControls).toEqual([BuiltInGrantControl.Mfa]);
    expect(result.grantControls.customAuthenticationFactors).toEqual([]);
    expect(result.grantControls.termsOfUse).toEqual(['terms1']);
  });

  it('should map boolean and number fields, and keep empty as undefined', () => {
    const row = {
      DisableResilienceDefaults: '',
      ApplicationEnforcedRestrictions: 'true',
      CloudAppSecurity_cloudAppSecurityType: 'blockDownloads',
      CloudAppSecurity_isEnabled: 'false',
      SignInFrequency_Value: '5',
      SignInFrequency_Type: 'days',
      SignInFrequency_AuthenticationType: 'primaryAndSecondaryAuthentication',
      SignInFrequency_FrequencyInterval: 'timeBased',
      SignInFrequency_IsEnabled: '',
      PersistentBrowser_Mode: 'always',
      PersistentBrowser_IsEnabled: 'true',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.sessionControls.disableResilienceDefaults).toBeUndefined();
    expect(result.sessionControls.applicationEnforcedRestrictions?.isEnabled).toBe(true);
    expect(result.sessionControls.cloudAppSecurity).toBeDefined();
    if (result.sessionControls.cloudAppSecurity) {
      expect(result.sessionControls.cloudAppSecurity.cloudAppSecurityType).toBe(CloudAppSecurityType.BlockDownloads);
      expect(result.sessionControls.cloudAppSecurity.isEnabled).toBe(false);
    }
    expect(result.sessionControls.signInFrequency).toBeDefined();
    if (result.sessionControls.signInFrequency) {
      expect(result.sessionControls.signInFrequency.value).toBe(5);
      expect(result.sessionControls.signInFrequency.type).toBe(SignInFrequencyType.Days);
      expect(result.sessionControls.signInFrequency.authenticationType).toBe(SignInFrequencyAuthenticationType.PrimaryAndSecondaryAuthentication);
      expect(result.sessionControls.signInFrequency.frequencyInterval).toBe(SignInFrequencyInterval.TimeBased);
      expect(result.sessionControls.signInFrequency.isEnabled).toBeUndefined();
    }
    expect(result.sessionControls.persistentBrowser).toBeDefined();
    if (result.sessionControls.persistentBrowser) {
      expect(result.sessionControls.persistentBrowser.mode).toBe(PersistentBrowserMode.Always);
      expect(result.sessionControls.persistentBrowser.isEnabled).toBe(true);
    }
  });

  it('should keep filter as string or undefined', () => {
    const row = {
      DeviceFilter: 'simple string',
      ApplicationFilter: 'another string',
      ServicePrincipalFilter: 'spfilter',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.conditions.devices.deviceFilter).toBe('simple string');
    expect(result.conditions.applications.applicationFilter).toBe('another string');
    expect(result.conditions.clientApplications.servicePrincipalFilter).toBe('spfilter');
  });

  it('should map grantControls.operator and leave authenticationStrength undefined if not present', () => {
    const row = {
      Operator: 'AND',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.grantControls.operator).toBe('AND');
    expect(result.grantControls.authenticationStrength).toBeUndefined();
  });

  it('should parse guestOrExternalUserTypes as GuestOrExternalUserType enum values', () => {
    const row = {
      IncludeGuestsOrExternalUsers: `@{guestOrExternalUserTypes=${GuestOrExternalUserType.B2BCollaborationGuest},${GuestOrExternalUserType.B2BCollaborationMember}; externalTenants=tenantA,tenantB}`,
      excludeGuestsOrExternalUsers: `@{guestOrExternalUserTypes=${GuestOrExternalUserType.InternalGuest}; externalTenants=tenantC}`,
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
    expect(result.conditions.users.includeGuestsOrExternalUsers).toBeUndefined();
    expect(result.grantControls.builtInControls).toEqual([]);
    expect(result.sessionControls).toBeDefined();
  });

  it('should ignore unknown/extra fields', () => {
    const row = {
      ID: 'id',
      UnknownField: 'should be ignored',
      includeApplications: 'app1',
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
      State: 'notAValidState',
      UserRiskLevels: 'notAValidRisk,high',
      IncludePlatforms: 'notAPlatform,windows',
      BuiltInControls: 'notAControl,mfa',
    };
    const result = fromCSVRow(row) as Policy;
    // Invalid enums will be cast as strings, so they will appear in the array
    expect(result.state).toBe('notAValidState');
    expect(result.conditions.userRiskLevels).toEqual(['notAValidRisk', RiskLevel.High]);
    expect(result.conditions.platforms.includePlatforms).toEqual(['notAPlatform', DevicePlatform.Windows]);
    expect(result.grantControls.builtInControls).toEqual(['notAControl', BuiltInGrantControl.Mfa]);
  });

  it('should handle partial/optional nested objects', () => {
    const row = {
      IncludeGuestsOrExternalUsers: '@{guestOrExternalUserTypes=value1}',
    };
    const result = fromCSVRow(row) as Policy;
    expect(result.conditions.users.includeGuestsOrExternalUsers).toEqual({
      guestOrExternalUserTypes: ['value1'],
    });
  });
});
