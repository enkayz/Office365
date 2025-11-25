import type { Client } from '@microsoft/microsoft-graph-client';

export async function listSensitivityLabels(client: Client) {
  // Graph beta endpoint
  const res = await client.api('/security/informationProtection/labels').version('beta').get();
  const items = res.value || [];
  // Return full object for diagnosis
  return items;
}