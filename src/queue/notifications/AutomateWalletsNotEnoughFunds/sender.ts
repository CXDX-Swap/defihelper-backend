import { Process } from '@models/Queue/Entity';
import container from '@container';
import { triggerTableName } from '@models/Automate/Entity';
import { tableName as walletTableName } from '@models/Wallet/Entity';
import { transferTableName } from '@models/Billing/Entity';
import { ContactBroker, ContactStatus } from '@models/Notification/Entity';
import BN from 'bignumber.js';

export default async (process: Process) => {
  const { userId } = process.task.params as { userId: string };

  const user = await container.model.userTable().where({ id: userId }).first();
  if (!user) {
    throw new Error('User not found');
  }

  const database = container.database();
  const triggers = await container.model
    .automateTriggerTable()
    .columns(
      `${walletTableName}.id as walletId`,
      `${walletTableName}.network as walletNetwork`,
      `${triggerTableName}.id as triggerId`,
    )
    .innerJoin(walletTableName, `${triggerTableName}.wallet`, `${walletTableName}.id`)
    .where('active', true)
    .andWhere(`${walletTableName}.user`, user.id);

  const walletsFunds = await container.model
    .billingTransferTable()
    .column(`${walletTableName}.id as id`)
    .column(database.raw('coalesce(sum(amount), 0) as funds'))
    .innerJoin(walletTableName, `${walletTableName}.address`, `${transferTableName}.account`)
    .whereIn(
      `${walletTableName}.id`,
      triggers.map((t) => t.walletId),
    )
    .andWhere(`${transferTableName}.network`, database.raw(`${walletTableName}.network`))
    .andWhere(`${transferTableName}.blockchain`, database.raw(`${walletTableName}.blockchain`))
    .groupBy(`${walletTableName}.id`);

  const notifyBy = triggers.find(async (t) => {
    const walletFunds = walletsFunds.find((w) => w.id === t.walletId);

    if (!walletFunds) {
      throw new Error('wallet funds must be found here');
    }

    const chainNativeUSD = new BN(
      await container.blockchain.ethereum.byNetwork(t.walletNetwork).nativeTokenPrice(),
    ).toNumber();

    return walletFunds.funds * chainNativeUSD - (1 + chainNativeUSD * 0.1) <= 0;
  });

  if (!notifyBy) {
    return process.done();
  }

  const contacts = await container.model.userContactTable().where({
    user: user.id,
    status: ContactStatus.Active,
  });

  await Promise.all(
    contacts.map((contact) => {
      switch (contact.broker) {
        case ContactBroker.Email:
          return container.model.queueService().push('sendEmail', {
            email: contact.address,
            template: 'automateNotEnoughFunds',
            subject: '🚨Action required: automate may be paused',
            locale: user.locale,
          });

        case ContactBroker.Telegram:
          if (!contact.params?.chatId) {
            return null;
          }

          return container.model.queueService().push('sendTelegram', {
            chatId: contact.params.chatId,
            locale: user.locale,
            template: 'automateNotEnoughFunds',
            params: {
              debugInfo: notifyBy.id.substring(0, 8),
            },
          });

        default:
          throw new Error(`unexpected contact broker: ${contact.broker}`);
      }
    }),
  );

  return process.done();
};
