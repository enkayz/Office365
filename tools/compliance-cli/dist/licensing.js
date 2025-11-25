export async function listSkus(client) {
    const res = await client.api('/subscribedSkus').get();
    const items = res.value || [];
    return items.map((s) => ({
        skuId: s.skuId,
        skuPartNumber: s.skuPartNumber,
        prepaidUnits: s.prepaidUnits?.enabled,
        consumedUnits: s.consumedUnits,
        servicePlans: (s.servicePlans || []).map((p) => ({
            servicePlanId: p.servicePlanId,
            servicePlanName: p.servicePlanName,
            provisioningStatus: p.provisioningStatus
        }))
    }));
}
export async function listUserLicenses(client, top = 100) {
    const res = await client.api('/users').select(['id', 'displayName', 'userPrincipalName', 'assignedLicenses']).top(top).get();
    const items = res.value || [];
    return items.map((u) => ({
        id: u.id,
        name: u.displayName,
        upn: u.userPrincipalName,
        skus: (u.assignedLicenses || []).map((l) => l.skuId)
    }));
}
// Minimal, curated compliance mapping (extend as needed)
const COMPLIANCE_RELEVANT = new Set([
    'ENTERPRISEPREMIUM', // E5 (legacy name)
    'SPE_E5', // M365 E5
    'M365_E5_COMPLIANCE', // E5 Compliance add-on
    'ENTERPRISEPACK', // E3
    'E5_SECURITY', // Security add-on (not full compliance)
]);
export function highlightComplianceSkus(skus) {
    return skus.filter(s => COMPLIANCE_RELEVANT.has((s.skuPartNumber || '').toUpperCase()));
}
