import { listSensitivityLabels } from './labels.js';
export async function diagnosePurview(client) {
    const report = {
        timestamp: new Date().toISOString(),
        checks: [],
        score: 0,
        maxScore: 0
    };
    const addCheck = (name, status, message, points = 1) => {
        report.checks.push({ name, status, message });
        report.maxScore += points;
        if (status === 'PASS')
            report.score += points;
    };
    try {
        // 1. Fetch Labels
        const labels = await listSensitivityLabels(client);
        // Check: Label Existence
        if (labels.length > 0) {
            addCheck('Label Existence', 'PASS', `Found ${labels.length} sensitivity labels.`);
        }
        else {
            addCheck('Label Existence', 'FAIL', 'No sensitivity labels found. You should define a taxonomy.');
        }
        // Check: Taxonomy Depth (Parent/Child)
        const hasSublabels = labels.some((l) => l.parent);
        if (hasSublabels) {
            addCheck('Taxonomy Structure', 'PASS', 'Taxonomy includes sub-labels (good for granularity).');
        }
        else {
            addCheck('Taxonomy Structure', 'WARN', 'Flat taxonomy detected. Consider using parent/child labels for better organization.');
        }
        // Check: Scope Coverage (File, Email, Site)
        // Note: 'scopes' property availability depends on API version/permissions.
        // We check if we can find evidence of different scopes.
        let hasFileScope = false;
        let hasSiteScope = false;
        // Heuristic: Check label actions or properties if 'scopes' isn't direct
        // In Beta, 'scopes' might be an array like ['File', 'Email']
        labels.forEach((l) => {
            const scopes = l.scopes || [];
            if (scopes.includes('File') || scopes.includes('Email'))
                hasFileScope = true;
            if (scopes.includes('Site') || scopes.includes('UnifiedGroup'))
                hasSiteScope = true;
        });
        if (hasFileScope) {
            addCheck('File/Email Scope', 'PASS', 'Labels cover File and Email scopes.');
        }
        else {
            addCheck('File/Email Scope', 'WARN', 'No labels explicitly targeting File/Email found (or scope data missing).');
        }
        if (hasSiteScope) {
            addCheck('Container Scope', 'PASS', 'Labels cover Groups/Sites (Container) scope.');
        }
        else {
            addCheck('Container Scope', 'WARN', 'No labels targeting Groups/Sites found. Enable "EnableMIPLabels" in directory settings if needed.');
        }
        // 2. Fetch Policies (Best Effort)
        // /security/informationProtection/labelPolicies
        try {
            const policyRes = await client.api('/security/informationProtection/labelPolicies').version('beta').get();
            const policies = policyRes.value || [];
            if (policies.length > 0) {
                addCheck('Label Policies', 'PASS', `Found ${policies.length} label policies.`);
                // Check: Mandatory Labeling
                const hasMandatory = policies.some((p) => p.isMandatory);
                if (hasMandatory) {
                    addCheck('Mandatory Labeling', 'PASS', 'Mandatory labeling is enabled in at least one policy.');
                }
                else {
                    addCheck('Mandatory Labeling', 'WARN', 'Mandatory labeling is not enforced. Consider enabling it for higher security.');
                }
                // Check: Default Label
                const hasDefault = policies.some((p) => p.defaultLabelId);
                if (hasDefault) {
                    addCheck('Default Label', 'PASS', 'Default label is configured in at least one policy.');
                }
                else {
                    addCheck('Default Label', 'WARN', 'No default label configured. Users might leave content unlabeled.');
                }
            }
            else {
                addCheck('Label Policies', 'FAIL', 'No label policies found. Labels are not published to users.');
            }
        }
        catch (e) {
            addCheck('Policy Access', 'WARN', `Could not fetch policies (Permissions?): ${e.message}`, 0);
        }
    }
    catch (e) {
        addCheck('API Access', 'FAIL', `Critical failure fetching labels: ${e.message}`, 0);
    }
    return report;
}
