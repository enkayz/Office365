import type {Client} from '@microsoft/microsoft-graph-client';

export async function listSkus(client: Client) {
  const res = await client.api('/subscribedSkus').get();
  const items = res.value || [];
  return items.map((s: any) => ({
    skuId: s.skuId,
    skuPartNumber: s.skuPartNumber,
    prepaidUnits: s.prepaidUnits?.enabled,
    consumedUnits: s.consumedUnits,
    servicePlans: (s.servicePlans || []).map((p: any) => ({
      servicePlanId: p.servicePlanId,
      servicePlanName: p.servicePlanName,
      provisioningStatus: p.provisioningStatus
    }))
  }));
}

export async function listUserLicenses(client: Client, top = 100) {
  const res = await client.api('/users').select(['id','displayName','userPrincipalName','assignedLicenses']).top(top).get();
  const items = res.value || [];
  return items.map((u: any) => ({
    id: u.id,
    name: u.displayName,
    upn: u.userPrincipalName,
    skus: (u.assignedLicenses || []).map((l: any) => l.skuId)
  }));
}

// Minimal, curated compliance mapping (extend as needed)
const COMPLIANCE_RELEVANT = new Set<string>([
  'ENTERPRISEPREMIUM', // E5 (legacy name)
  'SPE_E5',            // M365 E5
  'M365_E5_COMPLIANCE',// E5 Compliance add-on
  'ENTERPRISEPACK',    // E3
  'E5_SECURITY',       // Security add-on (not full compliance)
]);

export function highlightComplianceSkus(skus: Array<{skuPartNumber: string}>) {
  return skus.filter(s => COMPLIANCE_RELEVANT.has((s.skuPartNumber || '').toUpperCase()));
}
