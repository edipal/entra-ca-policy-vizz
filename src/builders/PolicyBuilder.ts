import {
  Policy,
  ConditionalAccessPolicyState,
  RiskLevel,
  DevicePlatform,
  BuiltInGrantControl,
  ClientAppType,
  PersistentBrowserMode,
  CloudAppSecurityType,
  SignInFrequencyType,
  SignInFrequencyAuthenticationType,
  SignInFrequencyInterval,
  GuestOrExternalUserType,
  Operator,
  ContinuousAccessEvaluationType,
  UserActionType,
  FilterModeType,
} from "@/types/Policy"

// Default character to split CSV collection fields (e.g., lists)
export const COLLECTION_SPLIT_CHAR = ","

export interface PolicyBuilderOptions {
  collectionSplitChar?: string
  columnMap?: ColumnMap
}

// Mutable module-level defaults that can be set once per import run
const CURRENT_OPTIONS: { collectionSplitChar: string; columnMap: ColumnMap } = {
  collectionSplitChar: COLLECTION_SPLIT_CHAR,
  columnMap: {} as ColumnMap, // will be initialized below after DEFAULT_COLUMN_MAP
}

const splitOrEmpty = (row: Record<string, string>, columnName: string): string[] => {
  const v = getValueOrUndef(row, columnName)
  const ch = CURRENT_OPTIONS.collectionSplitChar
  return v ? v.split(ch).map((s) => s.trim()) : []
}

const boolOrUndef = (row: Record<string, string>, columnName: string): boolean | undefined => {
  const v = getValueOrUndef(row, columnName)
  return v === "" ? undefined : v === "true" ? true : v === "false" ? false : undefined
}

const numOrUndef = (row: Record<string, string>, columnName: string): number | undefined => {
  const v = getValueOrUndef(row, columnName)
  return v ? Number(v) : undefined
}

function getValueOrUndef(row: Record<string, string>, columnName: string): string | undefined {
  const foundColumnKey = Object.keys(row).find(k => k.toLowerCase() === columnName.toLowerCase())
  return foundColumnKey ? row[foundColumnKey]?.trim() : undefined
}

function getValueAsEnumOrUdef<T extends object>(row: Record<string, string>, columnName: string, enumType: T): T[keyof T] | undefined {
  const value = getValueOrUndef(row, columnName)
  if (value && Object.values(enumType).includes(value as T[keyof T])) {
    return value as T[keyof T]
  }
  if (value) {
    console.warn(`Unexpected value for enum '${enumType.constructor.name}' in column '${columnName}': '${value}'`)
  }
  return undefined
}

function splitOrEmptyAsEnum<T extends object>(row: Record<string, string>, columnName: string, enumType: T): T[keyof T][] {
  const arr = splitOrEmpty(row, columnName)
  return arr
    .filter((v) => {
      const isValid = Object.values(enumType).includes(v as T[keyof T])
      if (!isValid && v) {
        console.warn(`Unexpected value for enum '${enumType.constructor.name}' in column '${columnName}': '${v}'`)
      }
      return isValid
    })
    .map((v) => v as T[keyof T])
}

// Mapping of logical field names to CSV column names (dot notation for clarity)
export const DEFAULT_COLUMN_MAP = {
   "id": "id",
   "displayName": "displayName",
   "createdDateTime": "createdDateTime",
   "modifiedDateTime": "modifiedDateTime",
   "state": "state",
   "conditions.applications.includeApplications": "conditions.applications.includeApplications",
   "conditions.applications.excludeApplications": "conditions.applications.excludeApplications",
   "conditions.applications.includeUserActions": "conditions.applications.includeUserActions",
   "conditions.applications.includeAuthenticationContextClassReferences": "conditions.applications.includeAuthenticationContextClassReferences",
   "conditions.applications.applicationFilter.mode": "conditions.applications.applicationFilter.mode",
   "conditions.applications.applicationFilter.rule": "conditions.applications.applicationFilter.rule",
  "conditions.authenticationFlows.transferMethods": "conditions.authenticationFlows.transferMethods",
   "conditions.clientApplications.includeServicePrincipals": "conditions.clientApplications.includeServicePrincipals",
   "conditions.clientApplications.excludeServicePrincipals": "conditions.clientApplications.excludeServicePrincipals",
   "conditions.clientApplications.servicePrincipalFilter.mode": "conditions.clientApplications.servicePrincipalFilter.mode",
   "conditions.clientApplications.servicePrincipalFilter.rule": "conditions.clientApplications.servicePrincipalFilter.rule",
   "conditions.clientAppTypes": "conditions.clientAppTypes",
   "conditions.devices.deviceFilter.mode": "conditions.devices.deviceFilter.mode",
   "conditions.devices.deviceFilter.rule": "conditions.devices.deviceFilter.rule",
   "conditions.locations.includeLocations": "conditions.locations.includeLocations",
   "conditions.locations.excludeLocations": "conditions.locations.excludeLocations",
   "conditions.platforms.includePlatforms": "conditions.platforms.includePlatforms",
   "conditions.platforms.excludePlatforms": "conditions.platforms.excludePlatforms",
   "conditions.servicePrincipalRiskLevels": "conditions.servicePrincipalRiskLevels",
   "conditions.signInRiskLevels": "conditions.signInRiskLevels",
   "conditions.userRiskLevels": "conditions.userRiskLevels",
   "conditions.users.includeUsers": "conditions.users.includeUsers",
   "conditions.users.excludeUsers": "conditions.users.excludeUsers",
   "conditions.users.includeGroups": "conditions.users.includeGroups",
   "conditions.users.excludeGroups": "conditions.users.excludeGroups",
   "conditions.users.includeRoles": "conditions.users.includeRoles",
   "conditions.users.excludeRoles": "conditions.users.excludeRoles",
  "conditions.users.includeGuestsOrExternalUsers.externalTenants.members": "conditions.users.includeGuestsOrExternalUsers.externalTenants.members",
   "conditions.users.includeGuestsOrExternalUsers.guestOrExternalUserTypes": "conditions.users.includeGuestsOrExternalUsers.guestOrExternalUserTypes",
   "conditions.users.excludeGuestsOrExternalUsers.externalTenants.members": "conditions.users.excludeGuestsOrExternalUsers.externalTenants.members",
   "conditions.users.excludeGuestsOrExternalUsers.guestOrExternalUserTypes": "conditions.users.excludeGuestsOrExternalUsers.guestOrExternalUserTypes",
  "conditions.insiderRiskLevels": "conditions.insiderRiskLevels",
   "grantControls.builtInControls": "grantControls.builtInControls",
   "grantControls.customAuthenticationFactors": "grantControls.customAuthenticationFactors",
   "grantControls.termsOfUse": "grantControls.termsOfUse",
   "grantControls.operator": "grantControls.operator",
  "grantControls.authenticationStrength.displayName": "grantControls.authenticationStrength.displayName",
   "sessionControls.applicationEnforcedRestrictions.isEnabled": "sessionControls.applicationEnforcedRestrictions.isEnabled",
   "sessionControls.cloudAppSecurity.cloudAppSecurityType": "sessionControls.cloudAppSecurity.cloudAppSecurityType",
  "sessionControls.continuousAccessEvaluation.mode": "sessionControls.continuousAccessEvaluation.mode",
   "sessionControls.disableResilienceDefaults": "sessionControls.disableResilienceDefaults",
   "sessionControls.persistentBrowser.mode": "sessionControls.persistentBrowser.mode",
  "sessionControls.secureSignInSession.isEnabled": "sessionControls.secureSignInSession.isEnabled",
   "sessionControls.signInFrequency.value": "sessionControls.signInFrequency.value",
   "sessionControls.signInFrequency.type": "sessionControls.signInFrequency.type",
   "sessionControls.signInFrequency.authenticationType": "sessionControls.signInFrequency.authenticationType",
   "sessionControls.signInFrequency.frequencyInterval": "sessionControls.signInFrequency.frequencyInterval",
}

export type ColumnMap = typeof DEFAULT_COLUMN_MAP

// Backward-compatible export
export const COLUMN_MAP = DEFAULT_COLUMN_MAP

// Initialize CURRENT_OPTIONS columnMap with defaults now that the const is defined
CURRENT_OPTIONS.columnMap = DEFAULT_COLUMN_MAP

// Helper to get column name from logical name (dot notation) using current defaults
const col = (logical: keyof ColumnMap) => CURRENT_OPTIONS.columnMap[logical]

// API to configure defaults from the app flow
export function setPolicyBuilderDefaults(opts: PolicyBuilderOptions) {
  if (opts.collectionSplitChar) CURRENT_OPTIONS.collectionSplitChar = opts.collectionSplitChar
  if (opts.columnMap) CURRENT_OPTIONS.columnMap = opts.columnMap
}

export function getPolicyBuilderDefaults(): Readonly<typeof CURRENT_OPTIONS> {
  return CURRENT_OPTIONS
}

export function fromCSVRow(row: Record<string, string>, _options?: PolicyBuilderOptions): Policy {
  // _options ignored to keep call sites clean; configure via setPolicyBuilderDefaults instead
  const displayName = getValueOrUndef(row, col("displayName")) || undefined
  const codeFromDisplay = displayName?.match(/CA\d{3,5}/)?.[0]
  const fallbackId = getValueOrUndef(row, col("id"))
  const code = codeFromDisplay || displayName || fallbackId

  const policy: Policy = {
    id: getValueOrUndef(row, col("id")),
    displayName,
    code,
    createdDateTime: getValueOrUndef(row, col("createdDateTime")),
    modifiedDateTime: getValueOrUndef(row, col("modifiedDateTime")),
    state: getValueAsEnumOrUdef(row, col("state"), ConditionalAccessPolicyState),
    conditions: {
      applications: {
  includeApplications: splitOrEmpty(row, col("conditions.applications.includeApplications")),
  excludeApplications: splitOrEmpty(row, col("conditions.applications.excludeApplications")),
  includeUserActions: splitOrEmptyAsEnum(row, col("conditions.applications.includeUserActions"), UserActionType),
  includeAuthenticationContextClassReferences: splitOrEmpty(row, col("conditions.applications.includeAuthenticationContextClassReferences")),
        applicationFilter: {
          mode: getValueAsEnumOrUdef(row, col("conditions.applications.applicationFilter.mode"), FilterModeType),
          rule: getValueOrUndef(row, col("conditions.applications.applicationFilter.rule")),
        }
      },
      authenticationFlows: splitOrEmpty(row, col("conditions.authenticationFlows.transferMethods")),
      clientApplications: {
        includeServicePrincipals: splitOrEmpty(row, col("conditions.clientApplications.includeServicePrincipals")),
        excludeServicePrincipals: splitOrEmpty(row, col("conditions.clientApplications.excludeServicePrincipals")),
        servicePrincipalFilter: {
          mode: getValueAsEnumOrUdef(row, col("conditions.clientApplications.servicePrincipalFilter.mode"), FilterModeType),
          rule: getValueOrUndef(row, col("conditions.clientApplications.servicePrincipalFilter.rule")),
        }
      },
  clientAppTypes: splitOrEmptyAsEnum(row, col("conditions.clientAppTypes"), ClientAppType),
      devices: {
        deviceFilter: {
          mode: getValueAsEnumOrUdef(row, col("conditions.devices.deviceFilter.mode"), FilterModeType),
          rule: getValueOrUndef(row, col("conditions.devices.deviceFilter.rule")),
        }
      },
      locations: {
        includeLocations: splitOrEmpty(row, col("conditions.locations.includeLocations")),
        excludeLocations: splitOrEmpty(row, col("conditions.locations.excludeLocations")),
      },
      platforms: {
  includePlatforms: splitOrEmptyAsEnum(row, col("conditions.platforms.includePlatforms"), DevicePlatform),
  excludePlatforms: splitOrEmptyAsEnum(row, col("conditions.platforms.excludePlatforms"), DevicePlatform),
      },
  servicePrincipalRiskLevels: splitOrEmptyAsEnum(row, col("conditions.servicePrincipalRiskLevels"), RiskLevel),
  signInRiskLevels: splitOrEmptyAsEnum(row, col("conditions.signInRiskLevels"), RiskLevel),
  userRiskLevels: splitOrEmptyAsEnum(row, col("conditions.userRiskLevels"), RiskLevel),
      users: {
        includeUsers: splitOrEmpty(row, col("conditions.users.includeUsers")),
        excludeUsers: splitOrEmpty(row, col("conditions.users.excludeUsers")),
        includeGroups: splitOrEmpty(row, col("conditions.users.includeGroups")),
        excludeGroups: splitOrEmpty(row, col("conditions.users.excludeGroups")),
        includeRoles: splitOrEmpty(row, col("conditions.users.includeRoles")),
        excludeRoles: splitOrEmpty(row, col("conditions.users.excludeRoles")),
        includeGuestsOrExternalUsers: {
          externalTenants: splitOrEmpty(row, col("conditions.users.includeGuestsOrExternalUsers.externalTenants.members")),
          guestOrExternalUserTypes: splitOrEmptyAsEnum(row, col("conditions.users.includeGuestsOrExternalUsers.guestOrExternalUserTypes"), GuestOrExternalUserType),
        },
        excludeGuestsOrExternalUsers: {
          externalTenants: splitOrEmpty(row, col("conditions.users.excludeGuestsOrExternalUsers.externalTenants.members")),
          guestOrExternalUserTypes: splitOrEmptyAsEnum(row, col("conditions.users.excludeGuestsOrExternalUsers.guestOrExternalUserTypes"), GuestOrExternalUserType),
        }
      },
      insiderRiskLevels: splitOrEmpty(row, col("conditions.insiderRiskLevels")),
    },
    grantControls: {
      builtInControls: splitOrEmptyAsEnum(row, col("grantControls.builtInControls"), BuiltInGrantControl),
      customAuthenticationFactors: splitOrEmpty(row, col("grantControls.customAuthenticationFactors")),
      termsOfUse: splitOrEmpty(row, col("grantControls.termsOfUse")),
      operator: getValueAsEnumOrUdef(row, col("grantControls.operator"), Operator),
      authenticationStrength: getValueOrUndef(row, col("grantControls.authenticationStrength.displayName")),
    },
    sessionControls: {
      applicationEnforcedRestrictions: boolOrUndef(row, col("sessionControls.applicationEnforcedRestrictions.isEnabled")),
      cloudAppSecurity: getValueAsEnumOrUdef(row, col("sessionControls.cloudAppSecurity.cloudAppSecurityType"), CloudAppSecurityType),
      continuousAccessEvaluation: getValueAsEnumOrUdef(row, col("sessionControls.continuousAccessEvaluation.mode"), ContinuousAccessEvaluationType),
      disableResilienceDefaults: boolOrUndef(row, col("sessionControls.disableResilienceDefaults")),
      persistentBrowser: getValueAsEnumOrUdef(row, col("sessionControls.persistentBrowser.mode"), PersistentBrowserMode),
      secureSignInSession: boolOrUndef(row, col("sessionControls.secureSignInSession.isEnabled")),
      signInFrequency: {
        value: numOrUndef(row, col("sessionControls.signInFrequency.value")),
        type: getValueAsEnumOrUdef(row, col("sessionControls.signInFrequency.type"), SignInFrequencyType),
        authenticationType: getValueAsEnumOrUdef(row, col("sessionControls.signInFrequency.authenticationType"), SignInFrequencyAuthenticationType),
        frequencyInterval: getValueAsEnumOrUdef(row, col("sessionControls.signInFrequency.frequencyInterval"), SignInFrequencyInterval),
      },
    },
  }
  return policy
}
