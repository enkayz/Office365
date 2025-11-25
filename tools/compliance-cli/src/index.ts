#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { getCredential } from './auth.js';
import { getGraphClient } from './graph.js';
import { listSkus, listUserLicenses, highlightComplianceSkus } from './licensing.js';
import { listDirectoryRoles, listRoleMembers, PURVIEW_RELEVANT_ROLES } from './roles.js';
import { listSensitivityLabels } from './labels.js';
import { listAuditSubscriptions, startAuditSubscription, listAuditContent, fetchAuditBlob } from './mgmt.js';

const program = new Command();
program
  .name('compliance-cli')
  .description('QoL CLI for Microsoft 365 compliance & security tasks (no PowerShell)')
  .version('0.1.0');

program
  .command('auth-test')
  .description('Verify auth and print tenant info')
  .action(async () => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const orgRes = await client.api('/organization').select(['id', 'displayName', 'verifiedDomains']).get();
    const org = (orgRes.value && orgRes.value[0]) || {};
    // eslint-disable-next-line no-console
    console.log({ tenantObjectId: org.id, displayName: org.displayName, verifiedDomains: org.verifiedDomains?.map((d: any) => d.name) });
  });

program
  .command('licensing-skus')
  .option('--only-compliance', 'Show only compliance-relevant SKUs', false)
  .description('List subscribed SKUs')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const skus = await listSkus(client);
    const out = opts.only_compliance ? highlightComplianceSkus(skus) : skus;
    // eslint-disable-next-line no-console
    console.table(out);
  });

program
  .command('licensing-users')
  .option('--top <n>', 'Max users to list', '100')
  .description('List users and their assigned license SKUs')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const users = await listUserLicenses(client, Number(opts.top));
    // eslint-disable-next-line no-console
    console.table(users.map((u: any) => ({ id: u.id, name: u.name, upn: u.upn, skuCount: u.skus.length })));
  });

program
  .command('roles-list')
  .option('--filter <q>', 'Filter by displayName contains')
  .description('List directory roles (active)')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const roles = await listDirectoryRoles(client);
    const filtered = opts.filter ? roles.filter((r: any) => (r.displayName || '').toLowerCase().includes(String(opts.filter).toLowerCase())) : roles;
    // eslint-disable-next-line no-console
    console.table(filtered);
  });

program
  .command('role-members')
  .requiredOption('--role-id <id>', 'Directory role id (from roles-list)')
  .description('List members of a directory role')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const members = await listRoleMembers(client, opts.roleId || opts['role-id']);
    // eslint-disable-next-line no-console
    console.table(members);
  });

program
  .command('labels-list')
  .description('List sensitivity labels (Graph beta)')
  .action(async () => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const labels = await listSensitivityLabels(client);
    // eslint-disable-next-line no-console
    console.table(labels);
  });

program
  .command('audit-list-subs')
  .description('List Office 365 Management Activity API subscriptions')
  .action(async () => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const orgRes = await client.api('/organization').select(['id']).get();
    const tenantGuid = (orgRes.value && orgRes.value[0]?.id) as string;
    const subs = await listAuditSubscriptions(credential, tenantGuid);
    // eslint-disable-next-line no-console
    console.table(subs);
  });

program
  .command('audit-start')
  .requiredOption('--type <contentType>', 'Content type, e.g., Audit.General, Audit.Exchange, DLP.All')
  .description('Start a subscription for a content type')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const orgRes = await client.api('/organization').select(['id']).get();
    const tenantGuid = (orgRes.value && orgRes.value[0]?.id) as string;
    const res = await startAuditSubscription(credential, tenantGuid, opts.type);
    // eslint-disable-next-line no-console
    console.log(res || 'OK');
  });

program
  .command('audit-list-content')
  .requiredOption('--type <contentType>', 'Content type, e.g., Audit.General, Audit.Exchange, DLP.All')
  .requiredOption('--start <iso>', 'Start time ISO (UTC)')
  .requiredOption('--end <iso>', 'End time ISO (UTC)')
  .description('List available content blobs for a time window')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const orgRes = await client.api('/organization').select(['id']).get();
    const tenantGuid = (orgRes.value && orgRes.value[0]?.id) as string;
    const out = await listAuditContent(credential, tenantGuid, opts.type, opts.start, opts.end);
    // eslint-disable-next-line no-console
    console.table(out);
  });

program
  .command('quickcheck')
  .description('Quick visibility check: roles, labels access, and audit API reachability')
  .action(async () => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);

    const orgRes = await client.api('/organization').select(['id']).get();
    const tenantGuid = (orgRes.value && orgRes.value[0]?.id) as string;

    // Roles snapshot
    const roles = await listDirectoryRoles(client);
    const roleNames = new Set(roles.map((r: any) => r.displayName));
    const roleMissing = PURVIEW_RELEVANT_ROLES.filter(r => !roleNames.has(r));

    // Labels availability
    let labelsOk = true;
    try { await listSensitivityLabels(client); } catch { labelsOk = false; }

    // Audit API availability
    let auditOk = true;
    try { await listAuditSubscriptions(credential, tenantGuid); } catch { auditOk = false; }

    // eslint-disable-next-line no-console
    console.log({
      tenantGuid,
      relevantRolesPresent: PURVIEW_RELEVANT_ROLES.filter(r => roleNames.has(r)),
      relevantRolesMissing: roleMissing,
      sensitivityLabelsAccessible: labelsOk,
      auditApiReachable: auditOk
    });
  });

// roles-audit
program
  .command('roles-audit')
  .option('--members', 'Show members for each relevant role', false)
  .description('Audit presence of Purview/DLP-relevant roles and (optionally) their members')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const roles = await listDirectoryRoles(client);
    const roleMap = new Map<string, { id: string; displayName: string }>();
    roles.forEach((r: any) => { if (r.displayName) roleMap.set(r.displayName, { id: r.id, displayName: r.displayName }); });

    const present = PURVIEW_RELEVANT_ROLES.filter(n => roleMap.has(n));
    const missing = PURVIEW_RELEVANT_ROLES.filter(n => !roleMap.has(n));

    const summary: Array<{ role: string; memberCount?: number }> = [];
    for (const name of present) {
      const id = roleMap.get(name)!.id;
      let members: Array<{ id: string; name: string; upn: string }> = [];
      if (opts.members) {
        try { members = await listRoleMembers(client, id); } catch { members = []; }
      } else {
        // Count only
        try { members = await listRoleMembers(client, id); } catch { members = []; }
      }
      summary.push({ role: name, memberCount: members.length });
      if (opts.members && members.length) {
        // eslint-disable-next-line no-console
        console.log(`\n${name}:`);
        // eslint-disable-next-line no-console
        console.table(members);
      }
    }

    // eslint-disable-next-line no-console
    console.log('\nSummary:');
    // eslint-disable-next-line no-console
    console.table(summary);
    if (missing.length) {
      // eslint-disable-next-line no-console
      console.log('\nMissing roles (consider enabling/assigning if needed):');
      // eslint-disable-next-line no-console
      console.table(missing.map(r => ({ role: r })));
    }
  });

// audit-fetch
import { isoRangeOrSince, safeFilename } from './util.js';
import fs from 'node:fs/promises';
import path from 'node:path';

program
  .command('audit-fetch')
  .option('--type <contentType>', 'Content type: Audit.General, Audit.Exchange, DLP.All', 'DLP.All')
  .option('--since <duration>', 'Relative window, e.g., 24h or 7d (overrides --start/--end)')
  .option('--start <iso>', 'Start time ISO (UTC)')
  .option('--end <iso>', 'End time ISO (UTC)')
  .option('--out <dir>', 'Output directory (files per blob)', 'audit-out')
  .option('--stdout', 'Write NDJSON to stdout instead of files', false)
  .option('--concurrency <n>', 'Parallel downloads', '4')
  .description('Fetch audit content blobs and save as JSON files or NDJSON to stdout')
  .action(async (opts) => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    const orgRes = await client.api('/organization').select(['id']).get();
    const tenantGuid = (orgRes.value && orgRes.value[0]?.id) as string;

    const { start, end } = isoRangeOrSince({ since: opts.since, start: opts.start, end: opts.end });
    const content = await listAuditContent(credential, tenantGuid, opts.type, start, end);
    const contentAny: any = content as any;
    const contentItems: any[] = Array.isArray(contentAny) ? contentAny : (contentAny?.value || contentAny || []);

    const outDir = path.resolve(process.cwd(), opts.out || 'audit-out');
    if (!opts.stdout) {
      await fs.mkdir(outDir, { recursive: true });
    }

    const items: Array<{ contentUri: string; contentId?: string; contentType?: string; expiration?: string }> = contentItems || [];
    const cc = Math.max(1, Number(opts.concurrency || '4'));
    let downloaded = 0; let records = 0;

    const queue = [...items];
    const workers = Array.from({ length: Math.min(cc, items.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        if (!item) break;
        try {
          const events = await fetchAuditBlob(credential, item.contentUri) as any[];
          if (opts.stdout) {
            for (const ev of events) {
              // eslint-disable-next-line no-console
              console.log(JSON.stringify(ev));
            }
          } else {
            const nameBase = safeFilename(item.contentId || path.basename(new URL(item.contentUri).pathname));
            const filePath = path.join(outDir, `${nameBase}.json`);
            await fs.writeFile(filePath, JSON.stringify(events, null, 2));
          }
          downloaded += 1;
          records += Array.isArray(events) ? events.length : 0;
        } catch (e: any) {
          // eslint-disable-next-line no-console
          console.error(`Failed ${item.contentUri}: ${e?.message || e}`);
        }
      }
    });

    await Promise.all(workers);
    // eslint-disable-next-line no-console
    console.log({ blobs: downloaded, records });
  });

// diagnose
import { diagnosePurview } from './diagnose.js';

program
  .command('diagnose')
  .description('Run a best-practices diagnosis of Purview Sensitivity Labels')
  .action(async () => {
    const { credential } = getCredential();
    const client = getGraphClient(credential);
    // eslint-disable-next-line no-console
    console.log('Running Purview Diagnosis...');
    const report = await diagnosePurview(client);

    // eslint-disable-next-line no-console
    console.table(report.checks);
    // eslint-disable-next-line no-console
    console.log(`\nScore: ${report.score}/${report.maxScore}`);
  });

program.parseAsync();
