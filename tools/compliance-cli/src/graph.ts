import {Client} from '@microsoft/microsoft-graph-client';
import {TokenCredential} from '@azure/identity';
import {GRAPH_SCOPE} from './auth.js';

export const getGraphClient = (credential: TokenCredential) => {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(GRAPH_SCOPE);
        if (!token) throw new Error('Failed to acquire Graph token');
        return token.token;
      }
    }
  });
};
