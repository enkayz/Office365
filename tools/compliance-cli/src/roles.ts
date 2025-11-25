import type {Client} from '@microsoft/microsoft-graph-client';

export async function listDirectoryRoles(client: Client) {
  const rolesRes = await client.api('/directoryRoles').get();
  const roles = rolesRes.value || [];
  return roles.map((r: any) => ({ id: r.id, roleTemplateId: r.roleTemplateId, displayName: r.displayName }));
}

export async function listRoleMembers(client: Client, roleId: string) {
  const res = await client.api(`/directoryRoles/${roleId}/members`).select(['id','displayName','userPrincipalName']).get();
  const members = res.value || [];
  return members.map((m: any) => ({ id: m.id, name: m.displayName, upn: m.userPrincipalName }));
}

export const PURVIEW_RELEVANT_ROLES = [
  'Compliance Administrator',
  'Compliance Data Administrator',
  'Security Reader',
  'Security Operator',
  'Global Reader',
  'Exchange Administrator' // often needed for legacy DLP transport rule visibility
];
