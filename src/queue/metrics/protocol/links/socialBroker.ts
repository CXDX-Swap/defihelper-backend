import container from '@container';
import { Process } from '@models/Queue/Entity';
import { SocialProvider } from '@services/SocialStats';

export default async (process: Process) => {
  const queue = container.model.queueService();

  await Promise.all(
    Object.values(SocialProvider).map(async (provider) => {
      const protocols = await container.model
        .protocolTable()
        .whereRaw(
          `'${provider}' IN (SELECT LOWER(jsonb_array_elements(links->'social')->>'name'))`,
        );

      return Promise.all(
        protocols.map(({ id: protocol }) =>
          queue.push('metricsProtocolLinksSocial', { provider, protocol }),
        ),
      );
    }),
  );

  return process.done();
};
