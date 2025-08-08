import type {
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
} from "@/types/Policy"

// Default character to split CSV collection fields (e.g., lists)
export const COLLECTION_SPLIT_CHAR = ","

// Helper to set array or value from CSV string
const splitOrEmpty = (v?: string) => (v ? v.split(COLLECTION_SPLIT_CHAR).map((s) => s.trim()) : [])
const boolOrUndef = (v?: string) => (v === "" ? undefined : v === "true" ? true : v === "false" ? false : undefined)
const numOrUndef = (v?: string) => (v ? Number(v) : undefined)

// Helper to parse guests/external users string to object
function parseGuestsOrExternalUsers(
  v?: string,
): { guestOrExternalUserTypes?: GuestOrExternalUserType[]; externalTenants?: string[] } | undefined {
  if (!v || !v.startsWith("@{")) return undefined
  const result: { guestOrExternalUserTypes?: GuestOrExternalUserType[]; externalTenants?: string[] } = {}
  const content = v.slice(2, -1) // remove '@{' and '}'
  content.split(";").forEach((part) => {
    const [key, value] = part.split("=")
    if (key && value) {
      if (key.trim() === "guestOrExternalUserTypes") {
        result.guestOrExternalUserTypes = value.split(",").map((s) => s.trim() as GuestOrExternalUserType)
      } else if (key.trim() === "externalTenants") {
        result.externalTenants = value.split(",").map((s) => s.trim())
      }
    }
  })
  return result
}

export function fromCSVRow(row: Record<string, string>): Policy {
  // console.log("Processing CSV row:", row) // Keep for debugging if needed

  // Extract displayName, handling potential undefined or empty string
  const displayName = row["Name"]?.trim() || undefined
  const codeMatch = displayName?.match(/CA\d{3,5}/)
  const code = codeMatch ? codeMatch[0] : displayName // If no CA code, use full displayName, or undefined if displayName is empty

  // Use state as-is (trimmed), do not lowercase
  const state = row["State"]?.trim() as ConditionalAccessPolicyState | undefined

  const policy: Policy = {
    id: row["ID"]?.trim() || undefined,
    displayName,
    code,
    createdDateTime: row["Created"]?.trim() || undefined,
    modifiedDateTime: row["Modified"]?.trim() || undefined,
    state: state, // Use the normalized state
    conditions: {
      applications: {
        includeApplications: splitOrEmpty(row["includeApplications"]),
        excludeApplications: splitOrEmpty(row["excludeApplications"]),
        includeUserActions: splitOrEmpty(row["IncludeUserActions"]),
        includeAuthenticationContextClassReferences: splitOrEmpty(row["IncludeAuthenticationContextClassReferences"]),
        applicationFilter: row["ApplicationFilter"]?.trim() || undefined,
      },
      authenticationFlows: {
        transferMethods: splitOrEmpty(row["transferMethods"]),
      },
      clientApplications: {
        includeServicePrincipals: splitOrEmpty(row["IncludeServicePrincipals"]),
        excludeServicePrincipals: splitOrEmpty(row["ExcludeServicePrincipals"]),
        servicePrincipalFilter: row["ServicePrincipalFilter"]?.trim() || undefined,
      },
      clientAppTypes: splitOrEmpty(row["clientAppTypes"]).map((v) => v as ClientAppType),
      devices: {
        deviceFilter: row["DeviceFilter"]?.trim() || undefined,
      },
      locations: {
        includeLocations: splitOrEmpty(row["IncludeLocations"]),
        excludeLocations: splitOrEmpty(row["ExcludeLocations"]),
      },
      platforms: {
        includePlatforms: splitOrEmpty(row["IncludePlatforms"]).map((v) => v as DevicePlatform),
        excludePlatforms: splitOrEmpty(row["ExcludePlatforms"]).map((v) => v as DevicePlatform),
      },
      servicePrincipalRiskLevels: splitOrEmpty(row["ServicePrincipalRiskLevels"]).map((v) => v as RiskLevel),
      signInRiskLevels: splitOrEmpty(row["SignInRiskLevels"]).map((v) => v as RiskLevel),
      userRiskLevels: splitOrEmpty(row["UserRiskLevels"]).map((v) => v as RiskLevel),
      users: {
        includeUsers: splitOrEmpty(row["IncludeUsers"]),
        excludeUsers: splitOrEmpty(row["ExcludeUsers"]),
        includeGroups: splitOrEmpty(row["includeGroups"]),
        excludeGroups: splitOrEmpty(row["excludeGroups"]),
        includeRoles: splitOrEmpty(row["IncludeRoles"]),
        excludeRoles: splitOrEmpty(row["ExcludeRoles"]),
        includeGuestsOrExternalUsers: parseGuestsOrExternalUsers(row["IncludeGuestsOrExternalUsers"]),
        excludeGuestsOrExternalUsers: parseGuestsOrExternalUsers(row["excludeGuestsOrExternalUsers"]),
      },
      insiderRiskLevels: splitOrEmpty(row["conditions.insiderRiskLevels"]),
    },
    grantControls: {
      builtInControls: splitOrEmpty(row["BuiltInControls"]).map((v) => v as BuiltInGrantControl),
      customAuthenticationFactors: splitOrEmpty(row["CustomAuthenticationFactors"]),
      termsOfUse: splitOrEmpty(row["TermsOfUse"]),
      operator: (row["Operator"]?.trim() || undefined) as "AND" | "OR",
      authenticationStrength: row["grantControls.authenticationStrength"]?.trim() || undefined,
    },
    sessionControls: {
      applicationEnforcedRestrictions:
        row["ApplicationEnforcedRestrictions"] !== undefined
          ? {
              isEnabled: boolOrUndef(row["ApplicationEnforcedRestrictions"]),
            }
          : undefined,
      cloudAppSecurity:
        row["CloudAppSecurity_cloudAppSecurityType"] !== undefined || row["CloudAppSecurity_isEnabled"] !== undefined
          ? {
              cloudAppSecurityType: (row["CloudAppSecurity_cloudAppSecurityType"]?.trim() ||
                undefined) as CloudAppSecurityType,
              isEnabled: boolOrUndef(row["CloudAppSecurity_isEnabled"]),
            }
          : undefined,
      persistentBrowser:
        row["PersistentBrowser_Mode"] !== undefined || row["PersistentBrowser_IsEnabled"] !== undefined
          ? {
              mode: (row["PersistentBrowser_Mode"]?.trim() || undefined) as PersistentBrowserMode,
              isEnabled: boolOrUndef(row["PersistentBrowser_IsEnabled"]),
            }
          : undefined,
      signInFrequency:
        row["SignInFrequency_Value"] !== undefined ||
        row["SignInFrequency_Type"] !== undefined ||
        row["SignInFrequency_IsEnabled"] !== undefined
          ? {
              value: numOrUndef(row["SignInFrequency_Value"]),
              type: (row["SignInFrequency_Type"]?.trim() || undefined) as SignInFrequencyType,
              isEnabled: boolOrUndef(row["SignInFrequency_IsEnabled"]),
              authenticationType: (row["SignInFrequency_AuthenticationType"]?.trim() ||
                undefined) as SignInFrequencyAuthenticationType,
              frequencyInterval: (row["SignInFrequency_FrequencyInterval"]?.trim() ||
                undefined) as SignInFrequencyInterval,
            }
          : undefined,
      disableResilienceDefaults: boolOrUndef(row["DisableResilienceDefaults"]),
    },
  }

  // console.log("Resulting Policy object:", policy) // Keep for debugging if needed
  return policy
}
