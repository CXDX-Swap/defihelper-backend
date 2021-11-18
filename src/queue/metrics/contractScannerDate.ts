import container from '@container';
import { Process } from '@models/Queue/Entity';

export interface Params {
  contract: string;
}

export default async (process: Process) => {
  const { contract: contractId } = process.task.params as Params;

  const contract = await container.model.contractTable().where('id', contractId).first();
  if (!contract) throw new Error('Contract not found');
  if (contract.blockchain !== 'ethereum') {
    return process.info('No ethereum').done();
  }

  const scanner = container.scanner();
  const scannerContract = await scanner.findContract(contract.network, contract.address);
  if (!scannerContract) {
    throw new Error('Contract not registered on scanner');
  }

  const { uniqueWalletsCount } = await scanner.getContractStatistics(scannerContract.id);

  await container.model.metricService().createContract(
    contract,
    {
      uniqueWalletsCount: uniqueWalletsCount.toString(),
    },
    new Date(),
  );

  return process.done();
};
