import { Process } from '@models/Queue/Entity';
import container from '@container';
import { EventUrls, NotificationType } from '@models/Notification/Entity';
import { contractBlockchainTableName, contractTableName } from '@models/Protocol/Entity';

interface Event {
  address: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  transactionHash: string;
  logIndex: number;
  args: Object;
  createdAt: Date;
}

export interface EventNotificationParams {
  events: Event[];
  eventName: string;
  webHookId: string;
}

export default async (process: Process) => {
  const eventNotificationParams = process.task.params as EventNotificationParams;

  const webHook = await container.model
    .contractEventWebHookTable()
    .where('id', eventNotificationParams.webHookId)
    .first();

  if (!webHook) {
    throw new Error(`WebHook is not found ${eventNotificationParams.webHookId}`);
  }

  const contract = await container.model
    .contractTable()
    .innerJoin(
      contractBlockchainTableName,
      `${contractBlockchainTableName}.id`,
      `${contractTableName}.id`,
    )
    .where(`${contractTableName}.id`, webHook.contract)
    .first();
  if (!contract) {
    throw new Error(`Contract ${webHook.contract} is not found for WebHook ${webHook.contract}`);
  }

  const subscriptions = await container.model
    .userEventSubscriptionTable()
    .where('webHook', eventNotificationParams.webHookId);

  const { txExplorerURL, walletExplorerURL } = container.blockchain[contract.blockchain].byNetwork(
    contract.network,
  );
  const eventsUrls: EventUrls[] = eventNotificationParams.events.map((event) => ({
    link: `${txExplorerURL}/${event.transactionHash}`,
    txHash: event.transactionHash,
  }));

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const contact = await container.model
        .userContactTable()
        .where('id', subscription.contact)
        .first();
      if (!contact) return;

      await container.model.notificationService().create(contact, {
        type: NotificationType.event,
        payload: {
          eventsUrls,
          eventName: eventNotificationParams.eventName,
          contractName: contract.name || contract.address,
          contractUrl: `${walletExplorerURL}/${contract.address}`,
          network: contract.network,
        },
      });
    }),
  );

  return process.done();
};
