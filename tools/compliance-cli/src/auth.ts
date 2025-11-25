import 'dotenv/config';
import {ClientSecretCredential, DeviceCodeCredential, TokenCredential} from '@azure/identity';

export type AuthMode = 'device' | 'client';

export const getCredential = (): {mode: AuthMode; credential: TokenCredential; tenantId: string} => {
  const tenantId = process.env.AZURE_TENANT_ID || 'common';
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId) {
    throw new Error('AZURE_CLIENT_ID is required');
  }

  if (clientSecret) {
    return {
      mode: 'client',
      tenantId,
      credential: new ClientSecretCredential(tenantId, clientId, clientSecret)
    };
  }
  return {
    mode: 'device',
    tenantId,
    credential: new DeviceCodeCredential({ tenantId, clientId, userPromptCallback: (info) => {
      // eslint-disable-next-line no-console
      console.log(`To sign in, visit ${info.verificationUri} and enter code: ${info.userCode}`);
    }})
  };
};

export const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
export const MGMT_SCOPE = 'https://manage.office.com/.default';
