import { fetch } from 'undici';
import { MGMT_SCOPE } from './auth.js';
const base = (tenantGuid) => `https://manage.office.com/api/v1.0/${tenantGuid}/activity/feed`;
async function getMgmtToken(cred) {
    const t = await cred.getToken(MGMT_SCOPE);
    if (!t)
        throw new Error('Failed to acquire Office 365 Management token');
    return t.token;
}
export async function listAuditSubscriptions(cred, tenantGuid) {
    const token = await getMgmtToken(cred);
    const url = `${base(tenantGuid)}/subscriptions/list`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok)
        throw new Error(`List subscriptions failed: ${r.status} ${r.statusText}`);
    return r.json();
}
export async function startAuditSubscription(cred, tenantGuid, contentType) {
    const token = await getMgmtToken(cred);
    const url = `${base(tenantGuid)}/subscriptions/start?contentType=${encodeURIComponent(contentType)}&publisherIdentifier=${encodeURIComponent(tenantGuid)}`;
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok)
        throw new Error(`Start subscription failed: ${r.status} ${r.statusText}`);
    return r.text();
}
export async function listAuditContent(cred, tenantGuid, contentType, startTimeIso, endTimeIso) {
    const token = await getMgmtToken(cred);
    const url = `${base(tenantGuid)}/subscriptions/content?contentType=${encodeURIComponent(contentType)}&publisherIdentifier=${encodeURIComponent(tenantGuid)}&startTime=${encodeURIComponent(startTimeIso)}&endTime=${encodeURIComponent(endTimeIso)}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok)
        throw new Error(`List content failed: ${r.status} ${r.statusText}`);
    return r.json();
}
export async function fetchAuditBlob(cred, blobUrl) {
    const token = await getMgmtToken(cred);
    const r = await fetch(blobUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok)
        throw new Error(`Fetch blob failed: ${r.status} ${r.statusText}`);
    return r.json();
}
