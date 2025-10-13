// Types for the graph schema used in Conditional Access Policy visualization

export enum GraphNodeCategory {
  Users = 'Users',
  TargetResources = 'Target Resources',
  Network = 'Network',
  Conditions = 'Conditions',
  Grant = 'Grant',
  Session = 'Session',
}

export enum GraphNodeSubcategory {
  // Users
  Default = 'Default',
  IncludeGroups = 'Include Groups',
  ExcludeGroups = 'Exclude Groups',
  IncludeExternalUsers = 'Include External Users',
  ExcludeExternalUsers = 'Exclude external Users',
  IncludeUsers = 'Include Users',
  ExcludeUsers = 'Exclude Users',
  IncludeRoles = 'Include Roles',
  ExcludeRoles = 'Exclude Roles',
  IncludeClientApps = 'Include Client Apps',
  ExcludeClientApps = 'Exclude Client Apps',
  ClientAppsFilter = 'Client Apps Filter',
  // Target Resources
  IncludeResources = 'Include Resources',
  ExcludeResources = 'Exclude Resources',
  ResourcesFilter = 'Resources Filter',
  UserAction = 'User Action',
  AuthenticationContext = 'Authentication context',
  // Network
  IncludeLocations = 'Include locations',
  ExcludeLocations = 'Exclude Locations',
  // Conditions
  IncludeDevicePlatforms = 'Include Device platforms',
  ExcludeDevicePlatforms = 'Exclude device platforms',
  ClientAppTypes = 'Client app types',
  Devices = 'Devices',
  UserRisk = 'User risk',
  SignInRisk = 'Sign-in risk',
  InsiderRisk = 'Insider risk',
  ServicePrincipalRisk = 'Service Principal Risk',
  AuthenticationFlows = 'Authentication flows',
  // Grant
  BuiltinControls = 'Builtin Controls',
  AuthenticationStrength = 'Authentication Strength',
  TermsOfUse = 'Terms of Use',
  CustomAuthenticationFactor = 'Custom Authentication Factor',
  // Session
  SignInFrequency = 'Sign In Frequency',
  PersistentBrowser = 'Persistent Browser',
  CloudAppSecurity = 'Cloud App Security',
}

export const CategorySubcategoryMap: Record<GraphNodeCategory, GraphNodeSubcategory[]> = {
  [GraphNodeCategory.Users]: [
    GraphNodeSubcategory.Default,
    GraphNodeSubcategory.IncludeGroups,
    GraphNodeSubcategory.ExcludeGroups,
    GraphNodeSubcategory.IncludeExternalUsers,
    GraphNodeSubcategory.ExcludeExternalUsers,
    GraphNodeSubcategory.IncludeUsers,
    GraphNodeSubcategory.ExcludeUsers,
    GraphNodeSubcategory.IncludeRoles,
    GraphNodeSubcategory.ExcludeRoles,
    GraphNodeSubcategory.IncludeClientApps,
    GraphNodeSubcategory.ExcludeClientApps,
    GraphNodeSubcategory.ClientAppsFilter,
  ],
  [GraphNodeCategory.TargetResources]: [
    GraphNodeSubcategory.Default,
    GraphNodeSubcategory.IncludeResources,
    GraphNodeSubcategory.ExcludeResources,
    GraphNodeSubcategory.ResourcesFilter,
    GraphNodeSubcategory.UserAction,
    GraphNodeSubcategory.AuthenticationContext,
  ],
  [GraphNodeCategory.Network]: [
    GraphNodeSubcategory.Default,
    GraphNodeSubcategory.IncludeLocations,
    GraphNodeSubcategory.ExcludeLocations,
  ],
  [GraphNodeCategory.Conditions]: [
    GraphNodeSubcategory.Default,
    GraphNodeSubcategory.IncludeDevicePlatforms,
    GraphNodeSubcategory.ExcludeDevicePlatforms,
    GraphNodeSubcategory.ClientAppTypes,
    GraphNodeSubcategory.Devices,
    GraphNodeSubcategory.UserRisk,
    GraphNodeSubcategory.SignInRisk,
    GraphNodeSubcategory.InsiderRisk,
    GraphNodeSubcategory.ServicePrincipalRisk,
    GraphNodeSubcategory.AuthenticationFlows,
  ],
  [GraphNodeCategory.Grant]: [
    GraphNodeSubcategory.Default,
    GraphNodeSubcategory.BuiltinControls,
    GraphNodeSubcategory.AuthenticationStrength,
    GraphNodeSubcategory.TermsOfUse,
    GraphNodeSubcategory.CustomAuthenticationFactor,
  ],
  [GraphNodeCategory.Session]: [
    GraphNodeSubcategory.Default,
    GraphNodeSubcategory.SignInFrequency,
    GraphNodeSubcategory.PersistentBrowser,
    GraphNodeSubcategory.CloudAppSecurity,
  ],
}

export enum GraphNodeName {
  // Conditions
  ConditionsUserRiskLevels = 'conditions.userRiskLevels',
  ConditionsSignInRiskLevels = 'conditions.signInRiskLevels',
  ConditionsClientAppTypes = 'conditions.clientAppTypes',
  ConditionsServicePrincipalRiskLevels = 'conditions.servicePrincipalRiskLevels',
  ConditionsDevicesDeviceFilter = 'conditions.devices.deviceFilter',
  ConditionsApplicationsIncludeApplications = 'conditions.applications.includeApplications',
  ConditionsApplicationsExcludeApplications = 'conditions.applications.excludeApplications',
  ConditionsApplicationsIncludeUserActions = 'conditions.applications.includeUserActions',
  ConditionsApplicationsIncludeAuthenticationContextClassReferences = 'conditions.applications.includeAuthenticationContextClassReferences',
  ConditionsApplicationsApplicationFilter = 'conditions.applications.applicationFilter',
  ConditionsUsersIncludeUsers = 'conditions.users.includeUsers',
  ConditionsUsersExcludeUsers = 'conditions.users.excludeUsers',
  ConditionsUsersIncludeGroups = 'conditions.users.includeGroups',
  ConditionsUsersExcludeGroups = 'conditions.users.excludeGroups',
  ConditionsUsersIncludeRoles = 'conditions.users.includeRoles',
  ConditionsUsersExcludeRoles = 'conditions.users.excludeRoles',
  ConditionsUsersIncludeGuestsOrExternalUsers = 'conditions.users.includeGuestsOrExternalUsers.guestOrExternalUserTypes',
  ConditionsUsersExcludeGuestsOrExternalUsers = 'conditions.users.excludeGuestsOrExternalUsers.guestOrExternalUserTypes',
  ConditionsPlatformsIncludePlatforms = 'conditions.platforms.includePlatforms',
  ConditionsPlatformsExcludePlatforms = 'conditions.platforms.excludePlatforms',
  ConditionsLocationsIncludeLocations = 'conditions.locations.includeLocations',
  ConditionsLocationsExcludeLocations = 'conditions.locations.excludeLocations',
  ConditionsClientApplicationsIncludeServicePrincipals = 'conditions.clientApplications.includeServicePrincipals',
  ConditionsClientApplicationsExcludeServicePrincipals = 'conditions.clientApplications.excludeServicePrincipals',
  ConditionsClientApplicationsServicePrincipalFilter = 'conditions.clientApplications.servicePrincipalFilter',
  ConditionsAuthenticationFlowsTransferMethods = 'conditions.authenticationFlows.transferMethods',
  SessionControlsDisableResilienceDefaults = 'sessionControls.disableResilienceDefaults',
  SessionControlsApplicationEnforcedRestrictions = 'sessionControls.applicationEnforcedRestrictions',
  SessionControlsCloudAppSecurity = 'sessionControls.cloudAppSecurity',
  SessionControlsSignInFrequency = 'sessionControls.signInFrequency',
  SessionControlsPersistentBrowser = 'sessionControls.persistentBrowser',
  GrantControlsBuiltInControls = 'grantControls.builtInControls',
  GrantControlsCustomAuthenticationFactor = 'grantControls.customAuthenticationFactor',
  GrantControlsAuthenticationStrength = 'grantControls.authenticationStrength',
  GrantControlsTermsOfUse = 'grantControls.termsOfUse',
  // None / Not Configured
  UsersNone = 'users.none',
  TargetResourcesNone = 'targetResources.none',
  NetworkNotConfigured = 'network.notConfigured',
  ConditionsNotConfigured = 'conditions.notConfigured',
  GrantNotConfigured = 'grant.notConfigured',
  SessionNotConfigured = 'session.notConfigured',
}

export const GraphNodeNameCategoryMap: Record<GraphNodeName, { category: GraphNodeCategory; subcategory: GraphNodeSubcategory }> = {
  [GraphNodeName.ConditionsUserRiskLevels]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.UserRisk },
  [GraphNodeName.ConditionsSignInRiskLevels]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.SignInRisk },
  [GraphNodeName.ConditionsClientAppTypes]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.ClientAppTypes },
  [GraphNodeName.ConditionsServicePrincipalRiskLevels]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.ServicePrincipalRisk },
  [GraphNodeName.ConditionsDevicesDeviceFilter]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.Devices },
  [GraphNodeName.ConditionsApplicationsIncludeApplications]: { category: GraphNodeCategory.TargetResources, subcategory: GraphNodeSubcategory.IncludeResources },
  [GraphNodeName.ConditionsApplicationsExcludeApplications]: { category: GraphNodeCategory.TargetResources, subcategory: GraphNodeSubcategory.ExcludeResources },
  [GraphNodeName.ConditionsApplicationsIncludeUserActions]: { category: GraphNodeCategory.TargetResources, subcategory: GraphNodeSubcategory.UserAction },
  [GraphNodeName.ConditionsApplicationsIncludeAuthenticationContextClassReferences]: { category: GraphNodeCategory.TargetResources, subcategory: GraphNodeSubcategory.AuthenticationContext },
  [GraphNodeName.ConditionsApplicationsApplicationFilter]: { category: GraphNodeCategory.TargetResources, subcategory: GraphNodeSubcategory.ResourcesFilter },
  [GraphNodeName.ConditionsUsersIncludeUsers]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.IncludeUsers },
  [GraphNodeName.ConditionsUsersExcludeUsers]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.ExcludeUsers },
  [GraphNodeName.ConditionsUsersIncludeGroups]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.IncludeGroups },
  [GraphNodeName.ConditionsUsersExcludeGroups]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.ExcludeGroups },
  [GraphNodeName.ConditionsUsersIncludeRoles]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.IncludeRoles },
  [GraphNodeName.ConditionsUsersExcludeRoles]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.ExcludeRoles },
  [GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.IncludeExternalUsers },
  [GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.ExcludeExternalUsers },
  [GraphNodeName.ConditionsPlatformsIncludePlatforms]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.IncludeDevicePlatforms },
  [GraphNodeName.ConditionsPlatformsExcludePlatforms]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.ExcludeDevicePlatforms },
  [GraphNodeName.ConditionsLocationsIncludeLocations]: { category: GraphNodeCategory.Network, subcategory: GraphNodeSubcategory.IncludeLocations },
  [GraphNodeName.ConditionsLocationsExcludeLocations]: { category: GraphNodeCategory.Network, subcategory: GraphNodeSubcategory.ExcludeLocations },
  [GraphNodeName.ConditionsClientApplicationsIncludeServicePrincipals]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.IncludeClientApps },
  [GraphNodeName.ConditionsClientApplicationsExcludeServicePrincipals]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.ExcludeClientApps },
  [GraphNodeName.ConditionsClientApplicationsServicePrincipalFilter]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.ClientAppsFilter },
  [GraphNodeName.ConditionsAuthenticationFlowsTransferMethods]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.AuthenticationFlows },
  [GraphNodeName.SessionControlsDisableResilienceDefaults]: { category: GraphNodeCategory.Session, subcategory: GraphNodeSubcategory.Default },
  [GraphNodeName.SessionControlsApplicationEnforcedRestrictions]: { category: GraphNodeCategory.Session, subcategory: GraphNodeSubcategory.Default },
  [GraphNodeName.SessionControlsCloudAppSecurity]: { category: GraphNodeCategory.Session, subcategory: GraphNodeSubcategory.CloudAppSecurity },
  [GraphNodeName.SessionControlsSignInFrequency]: { category: GraphNodeCategory.Session, subcategory: GraphNodeSubcategory.SignInFrequency },
  [GraphNodeName.SessionControlsPersistentBrowser]: { category: GraphNodeCategory.Session, subcategory: GraphNodeSubcategory.PersistentBrowser },
  [GraphNodeName.GrantControlsBuiltInControls]: { category: GraphNodeCategory.Grant, subcategory: GraphNodeSubcategory.BuiltinControls },
  [GraphNodeName.GrantControlsAuthenticationStrength]: { category: GraphNodeCategory.Grant, subcategory: GraphNodeSubcategory.AuthenticationStrength },
  [GraphNodeName.GrantControlsCustomAuthenticationFactor]: { category: GraphNodeCategory.Grant, subcategory: GraphNodeSubcategory.CustomAuthenticationFactor },
  [GraphNodeName.GrantControlsTermsOfUse]: { category: GraphNodeCategory.Grant, subcategory: GraphNodeSubcategory.TermsOfUse },
  [GraphNodeName.UsersNone]: { category: GraphNodeCategory.Users, subcategory: GraphNodeSubcategory.Default },
  [GraphNodeName.TargetResourcesNone]: { category: GraphNodeCategory.TargetResources, subcategory: GraphNodeSubcategory.Default },
  [GraphNodeName.NetworkNotConfigured]: { category: GraphNodeCategory.Network, subcategory: GraphNodeSubcategory.Default },
  [GraphNodeName.ConditionsNotConfigured]: { category: GraphNodeCategory.Conditions, subcategory: GraphNodeSubcategory.Default },
  [GraphNodeName.GrantNotConfigured]: { category: GraphNodeCategory.Grant, subcategory: GraphNodeSubcategory.Default },
  [GraphNodeName.SessionNotConfigured]: { category: GraphNodeCategory.Session, subcategory: GraphNodeSubcategory.Default },
}

export interface GraphNode {
  name: GraphNodeName;
  value: string;
  policies?: string[]; // CAxxxx codes
  category?: GraphNodeCategory;
  subcategory?: GraphNodeSubcategory;
}

export interface GraphEdge {
  node1: GraphNode;
  node2: GraphNode;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
