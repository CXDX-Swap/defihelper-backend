import container from '@container';
import { Process } from '@models/Queue/Entity';
import { getActionHandler, getConditionHandler, triggerTableName } from '@models/Automate/Entity';
import { walletTableName } from '@models/Wallet/Entity';

function isError(e: any): e is Error {
  return (
    e instanceof Error || (e !== null && typeof e === 'object' && typeof e.message === 'string')
  );
}

export interface Params {
  id: string;
}

export default async (process: Process) => {
  const { id } = process.task.params as Params;

  const automateService = container.model.automateService();
  const trigger = await automateService
    .triggerTable()
    .columns(`${triggerTableName}.*`)
    .innerJoin(walletTableName, `${walletTableName}.id`, `${triggerTableName}.wallet`)
    .where(`${triggerTableName}.id`, id)
    .andWhere(`${triggerTableName}.active`, true)
    .whereNull(`${walletTableName}.suspendReason`)
    .first();
  if (!trigger) throw new Error('Trigger not found');

  try {
    const conditions = await automateService
      .conditionTable()
      .where('trigger', trigger.id)
      .orderBy('priority', 'asc');
    if (conditions.length > 0) {
      const conditionsCheck = await conditions.reduce(async (prev, condition) => {
        if (!(await prev)) return false;

        try {
          return await getConditionHandler(condition).call(condition, condition.params);
        } catch (e) {
          throw new Error(
            `Condition "${condition.id}": ${isError(e) ? e.stack ?? e.message : String(e)}`,
          );
        }
      }, Promise.resolve(true));

      if (conditionsCheck === false) return process.done();
    }

    const actions = await automateService
      .actionTable()
      .where('trigger', trigger.id)
      .orderBy('priority', 'asc');
    if (actions.length > 0) {
      await actions.reduce(async (prev, action) => {
        await prev;

        try {
          return await Promise.resolve(getActionHandler(action).call(action, action.params));
        } catch (e) {
          throw new Error(
            `Action "${action.id}": ${isError(e) ? e.stack ?? e.message : String(e)}`,
          );
        }
      }, Promise.resolve(null));

      await automateService.createTriggerCallHistory(trigger);
      await automateService.updateTrigger({
        ...trigger,
        lastCallAt: new Date(),
      });
    }
  } catch (e) {
    await automateService.incrementTriggerRetries(trigger);
    const error = isError(e) ? e : new Error(`${e}`);
    await automateService.createTriggerCallHistory(trigger, error);

    return process.info(`crashed, retry #${trigger.retries}`).error(error).done();
  }

  await automateService.resetTriggerRetries(trigger);
  return process.done();
};
