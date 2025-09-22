import { fromPolicyCollection } from '../GraphBuilder';
import { GraphNodeCategory, GraphNodeName } from '@/types/Graph';
import { Policy, RiskLevel, ClientAppType, DevicePlatform, BuiltInGrantControl, GuestOrExternalUserType, ConditionalAccessPolicyState, CloudAppSecurityType, PersistentBrowserMode, SignInFrequencyType, SignInFrequencyAuthenticationType, SignInFrequencyInterval, Operator, FilterModeType, UserActionType } from '@/types/Policy';

describe('fromPolicyCollection', () => {
  it('creates nodes for all mapped fields and aggregates policy codes', () => {
    const policies: Policy[] = [
      {
        id: '1',
        code: 'CA0001',
        displayName: 'CA0001 - Test',
        createdDateTime: '',
        modifiedDateTime: '',
        state: ConditionalAccessPolicyState.Enabled,
        conditions: {
          userRiskLevels: [RiskLevel.High],
          signInRiskLevels: [RiskLevel.Medium],
          clientAppTypes: [ClientAppType.Browser],
          servicePrincipalRiskLevels: [RiskLevel.Low],
          devices: { deviceFilter: { mode: FilterModeType.Include, rule: 'filter1' } },
          applications: {
            includeApplications: ['app1'],
            excludeApplications: ['app2'],
            includeUserActions: [UserActionType.RegisterSecurityInfo],
            includeAuthenticationContextClassReferences: ['ctx1'],
            applicationFilter: { mode: FilterModeType.Exclude, rule: 'appFilter1' },
          },
          users: {
            includeUsers: ['user1'],
            excludeUsers: ['user2'],
            includeGroups: ['group1'],
            excludeGroups: ['group2'],
            includeRoles: ['role1'],
            excludeRoles: ['role2'],
            includeGuestsOrExternalUsers: {
              guestOrExternalUserTypes: [GuestOrExternalUserType.InternalGuest],
              externalTenants: ['tenant1', 'tenant2']
            },
            excludeGuestsOrExternalUsers: {
              guestOrExternalUserTypes: [GuestOrExternalUserType.B2BCollaborationGuest],
              externalTenants: undefined
            }
          },
          platforms: {
            includePlatforms: [DevicePlatform.IOS],
            excludePlatforms: [DevicePlatform.Android]
          },
          locations: {
            includeLocations: ['loc1'],
            excludeLocations: ['loc2']
          },
          clientApplications: {
            includeServicePrincipals: ['sp1'],
            excludeServicePrincipals: ['sp2'],
            servicePrincipalFilter: { mode: FilterModeType.Include, rule: 'spFilter1' }
          },
          authenticationFlows: ['method1'],
          insiderRiskLevels: []
        },
        grantControls: {
          builtInControls: [BuiltInGrantControl.Mfa],
          customAuthenticationFactors: ['factor1'],
          termsOfUse: ['tou1'],
          operator: Operator.OR,
          authenticationStrength: undefined
        },
        sessionControls: {
          disableResilienceDefaults: true,
          applicationEnforcedRestrictions: true ,
          cloudAppSecurity: CloudAppSecurityType.McasConfigured,
          persistentBrowser: PersistentBrowserMode.Always,
          signInFrequency: {
            value: 5,
            type: SignInFrequencyType.Hours,
            authenticationType: SignInFrequencyAuthenticationType.PrimaryAndSecondaryAuthentication,
            frequencyInterval: SignInFrequencyInterval.TimeBased
          }
        }
      },
      {
        id: '2',
        code: 'CA0002',
        displayName: 'CA0002 - Test',
        createdDateTime: '',
        modifiedDateTime: '',
        state: ConditionalAccessPolicyState.Enabled,
        conditions: {
          userRiskLevels: [RiskLevel.High],
          signInRiskLevels: [],
          clientAppTypes: [],
          servicePrincipalRiskLevels: [],
          devices: {
            deviceFilter: {}
          },
          applications: {},
          users: {},
          platforms: {},
          locations: {},
          clientApplications: {},
          authenticationFlows: [],
          insiderRiskLevels: []
        },
        grantControls: {},
        sessionControls: {
          applicationEnforcedRestrictions: undefined,
          cloudAppSecurity: undefined,
          persistentBrowser: undefined,
          signInFrequency: {}
        }
      }
    ];
    const graph = fromPolicyCollection(policies);
    // Node for userRiskLevels 'high' should have both CA0001 and CA0002
    const userRiskNode = graph.nodes.find(n => n.name === GraphNodeName.ConditionsUserRiskLevels && n.value === RiskLevel.High);
    expect(userRiskNode).toBeDefined();
    expect(userRiskNode?.policies).toContain('CA0001');
    expect(userRiskNode?.policies).toContain('CA0002');
    // Node for guests/external users should have value 'InternalGuest - tenant1' and 'InternalGuest - tenant2'
    expect(graph.nodes.some(n => n.name === GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers && n.value === `${GuestOrExternalUserType.InternalGuest} - tenant1`)).toBe(true);
    expect(graph.nodes.some(n => n.name === GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers && n.value === `${GuestOrExternalUserType.InternalGuest} - tenant2`)).toBe(true);
    // Node for excludeGuestsOrExternalUsers should have value 'B2BCollaborationGuest'
    expect(graph.nodes.some(n => n.name === GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers && n.value === GuestOrExternalUserType.B2BCollaborationGuest)).toBe(true);
    // Node for builtInControls should have prefix
    expect(graph.nodes.some(n => n.name === GraphNodeName.GrantControlsBuiltInControls && n.value === `${BuiltInGrantControl.Mfa}`)).toBe(true);
    // Node for signInFrequency (timeBased)
    expect(graph.nodes.some(n => n.name === GraphNodeName.SessionControlsSignInFrequency && n.value === '5 hours')).toBe(true);
    // Node for persistentBrowser
    expect(graph.nodes.some(n => n.name === GraphNodeName.SessionControlsPersistentBrowser && n.value === PersistentBrowserMode.Always)).toBe(true);
    // Node for applicationEnforcedRestrictions
    expect(graph.nodes.some(n => n.name === GraphNodeName.SessionControlsApplicationEnforcedRestrictions && n.value === 'true')).toBe(true);
    // Node for cloudAppSecurity
    expect(graph.nodes.some(n => n.name === GraphNodeName.SessionControlsCloudAppSecurity && n.value === `${CloudAppSecurityType.McasConfigured}`)).toBe(true);
    // Node for customAuthenticationFactors
    expect(graph.nodes.some(n => n.name === GraphNodeName.GrantControlsCustomAuthenticationFactor && n.value === 'factor1')).toBe(true);
    // Node for termsOfUse
    expect(graph.nodes.some(n => n.name === GraphNodeName.GrantControlsTermsOfUse && n.value === 'tou1')).toBe(true);

    // Check edges between categories for CA0001
    const orderedCategories = Object.values(GraphNodeCategory);
    let expectedEdgeCount = 0;
    for (let i = 0; i < orderedCategories.length - 1; i++) {
      const catA = orderedCategories[i];
      const catB = orderedCategories[i + 1];
      const nodesA = graph.nodes.filter(n => n.category === catA && n.policies?.includes('CA0001'));
      const nodesB = graph.nodes.filter(n => n.category === catB && n.policies?.includes('CA0001'));
      expectedEdgeCount += nodesA.length * nodesB.length;
      if (nodesA.length && nodesB.length) {
        // At least one edge between these categories
        const hasEdge = nodesA.some(nodeA => nodesB.some(nodeB => graph.edges.some(e => e.node1 === nodeA && e.node2 === nodeB)));
        expect(hasEdge).toBe(true);
      }
    }
    // Only count edges for CA0001
    const ca1NodeSet = new Set(graph.nodes.filter(n => n.policies?.includes('CA0001')));
    const ca1Edges = graph.edges.filter(e => ca1NodeSet.has(e.node1) && ca1NodeSet.has(e.node2));
    expect(ca1Edges.length).toBe(expectedEdgeCount);
  });

  it('handles empty and missing fields gracefully', () => {
    const policies: Policy[] = [
      {
        id: '3',
        code: 'CA0003',
        displayName: 'CA0003 - Empty',
        createdDateTime: '',
        modifiedDateTime: '',
        state: ConditionalAccessPolicyState.Enabled,
        conditions: {
          userRiskLevels: [],
          signInRiskLevels: [],
          clientAppTypes: [],
          servicePrincipalRiskLevels: [],
          devices: {},
          applications: {},
          users: {},
          platforms: {},
          locations: {},
          clientApplications: {},
          authenticationFlows: [],
          insiderRiskLevels: []
        },
        grantControls: {},
        sessionControls: {
          applicationEnforcedRestrictions: undefined,
          cloudAppSecurity: undefined,
          persistentBrowser: undefined,
          signInFrequency: {}
        }
      }
    ];
    const graph = fromPolicyCollection(policies);
    // Check all default nodes for CA0003
    expect(graph.nodes.some(n => n.name === GraphNodeName.UsersNone && n.policies?.includes('CA0003'))).toBe(true);
    expect(graph.nodes.some(n => n.name === GraphNodeName.TargetResourcesNone && n.policies?.includes('CA0003'))).toBe(true);
    expect(graph.nodes.some(n => n.name === GraphNodeName.NetworkNotConfigured && n.policies?.includes('CA0003'))).toBe(true);
    expect(graph.nodes.some(n => n.name === GraphNodeName.ConditionsNotConfigured && n.policies?.includes('CA0003'))).toBe(true);
    expect(graph.nodes.some(n => n.name === GraphNodeName.GrantNotConfigured && n.policies?.includes('CA0003'))).toBe(true);
    expect(graph.nodes.some(n => n.name === GraphNodeName.SessionNotConfigured && n.policies?.includes('CA0003'))).toBe(true);
    // Check edges between default nodes in order
    const orderedCategories = Object.values(GraphNodeCategory);
    let expectedDefaultEdgeCount = 0;
    for (let i = 0; i < orderedCategories.length - 1; i++) {
      const catA = orderedCategories[i];
      const catB = orderedCategories[i + 1];
      const nodeA = graph.nodes.find(n => n.category === catA && n.policies?.includes('CA0003'));
      const nodeB = graph.nodes.find(n => n.category === catB && n.policies?.includes('CA0003'));
      if (nodeA && nodeB) {
        expectedDefaultEdgeCount++;
        expect(graph.edges.some(e => e.node1 === nodeA && e.node2 === nodeB)).toBe(true);
      }
    }
    // Only count edges for CA0003
    const ca3NodeSet = new Set(graph.nodes.filter(n => n.policies?.includes('CA0003')));
    const ca3Edges = graph.edges.filter(e => ca3NodeSet.has(e.node1) && ca3NodeSet.has(e.node2));
    expect(ca3Edges.length).toBe(expectedDefaultEdgeCount);

    expect(graph.nodes.length).toBe(6); // default nodes were added
  });
});
