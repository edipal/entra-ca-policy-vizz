// TypeScript interface for policyInitial, based on the JSON schema

// Enums and union types for strongly-typed fields
export enum ConditionalAccessPolicyState {
  Enabled = 'enabled',
  Disabled = 'disabled',
  Report = 'enabledForReportingButNotEnforced',
}
export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Hidden = 'hidden',
  None = 'none',
  UnknownFutureValue = 'unknownFutureValue',
}
export enum ClientAppType {
  All = 'all',
  Browser = 'browser',
  MobileAppsAndDesktopClients = 'mobileAppsAndDesktopClients',
  ExchangeActiveSync = 'exchangeActiveSync',
  EasSupported = 'easSupported',
  Other = 'other',
}
export enum DevicePlatform {
  Android = 'android',
  IOS = 'iOS',
  Windows = 'windows',
  WindowsPhone = 'windowsPhone',
  MacOS = 'macOS',
  Linux = 'linux',
  All = 'all',
  UnknownFutureValue = 'unknownFutureValue',
}
export enum BuiltInGrantControl {
  Block = 'block',
  Mfa = 'mfa',
  CompliantDevice = 'compliantDevice',
  DomainJoinedDevice = 'domainJoinedDevice',
  ApprovedApplication = 'approvedApplication',
  CompliantApplication = 'compliantApplication',
  PasswordChange = 'passwordChange',
  UnknownFutureValue = 'unknownFutureValue',
}
export enum PersistentBrowserMode {
  Always = 'always',
  Never = 'never',
}
export enum CloudAppSecurityType {
  McasConfigured = 'mcasConfigured',
  MonitorOnly = 'monitorOnly',
  BlockDownloads = 'blockDownloads',
  UnknownFutureValue = 'unknownFutureValue',
}
export enum SignInFrequencyInterval {
  TimeBased = 'timeBased',
  EveryTime = 'everyTime',
  UnknownFutureValue = 'unknownFutureValue',
}
export enum SignInFrequencyType {
  Days = 'days',
  Hours = 'hours',
}
export enum SignInFrequencyAuthenticationType {
  PrimaryAndSecondaryAuthentication = 'primaryAndSecondaryAuthentication',
  SecondaryAuthentication = 'secondaryAuthentication',
  UnknownFutureValue = 'unknownFutureValue',
}
export enum GuestOrExternalUserType {
  None = 'none',
  InternalGuest = 'internalGuest',
  B2BCollaborationGuest = 'b2bCollaborationGuest',
  B2BCollaborationMember = 'b2bCollaborationMember',
  B2BDirectConnectUser = 'b2bDirectConnectUser',
  OtherExternalUser = 'otherExternalUser',
  ServiceProvider = 'serviceProvider',
  UnknownFutureValue = 'unknownFutureValue',
}
export enum ContinuousAccessEvaluationType {
  Disabled = 'disabled',
  StrictEnforcement = 'strictEnforcement',
  UnknownFutureValue = 'unknownFutureValue',
  StrictLocation = 'strictLocation',
}
export enum Operator {
  AND = "AND",
  OR = "OR",
}
export enum UserActionType {
  RegisterSecurityInfo = "urn:user:registersecurityinfo",
  RegisterDevice = "urn:user:registerdevice",
}
export enum FilterModeType {
  Include = 'include',
  Exclude = 'exclude',
}
export interface Policy {
  id?: string;
  displayName?: string;
  code?: string;
  description?: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
  state?: ConditionalAccessPolicyState;
  conditions: {
    applications: {
      includeApplications?: string[];
      excludeApplications?: string[];
      includeUserActions?: UserActionType[];
      includeAuthenticationContextClassReferences?: string[];
      applicationFilter?: {
        mode?: FilterModeType;
        rule?: string;
      };
    };
    authenticationFlows?: string[];
    clientApplications: {
      includeServicePrincipals?: string[];
      excludeServicePrincipals?: string[];
      servicePrincipalFilter?: {
        mode?: FilterModeType;
        rule?: string;
      };
    };
    clientAppTypes?: ClientAppType[];
    devices: {
      deviceFilter?: {
        mode?: FilterModeType;
        rule?: string;
      };
    };
    locations: {
      includeLocations?: string[];
      excludeLocations?: string[];
    };
    platforms: {
      includePlatforms?: DevicePlatform[];
      excludePlatforms?: DevicePlatform[];
    };
    servicePrincipalRiskLevels?: RiskLevel[];
    signInRiskLevels?: RiskLevel[];
    userRiskLevels?: RiskLevel[];
    users: {
      includeUsers?: string[];
      excludeUsers?: string[];
      includeGroups?: string[];
      excludeGroups?: string[];
      includeRoles?: string[];
      excludeRoles?: string[];
      includeGuestsOrExternalUsers?: {
        guestOrExternalUserTypes?: GuestOrExternalUserType[];
        externalTenants?: string[];
      };
      excludeGuestsOrExternalUsers?: {
        guestOrExternalUserTypes?: GuestOrExternalUserType[];
        externalTenants?: string[];
      };
    };
    insiderRiskLevels?: string[];
  };
  grantControls: {
    builtInControls?: BuiltInGrantControl[];
    customAuthenticationFactors?: string[];
    termsOfUse?: string[];
    operator?: Operator;
    authenticationStrength?: string;
  };
  sessionControls: {
    applicationEnforcedRestrictions?: boolean;
    cloudAppSecurity?: CloudAppSecurityType;
    continuousAccessEvaluation?: ContinuousAccessEvaluationType;
    disableResilienceDefaults?: boolean;
    persistentBrowser?: PersistentBrowserMode;
    secureSignInSession?: boolean;
    signInFrequency: {
      value?: number;
      type?: SignInFrequencyType;
      authenticationType?: SignInFrequencyAuthenticationType;
      frequencyInterval?: SignInFrequencyInterval;
    };
    globalSecureAccessFilteringProfile?: string;
  };
}
