export async function listSensitivityLabels(client) {
    // Graph beta endpoint
    const res = await client.api('/security/informationProtection/labels').version('beta').get();
    const items = res.value || [];
    // Return full object for diagnosis
    return items;
}
