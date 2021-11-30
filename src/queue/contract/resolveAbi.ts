import { Process } from '@models/Queue/Entity';
import container from '@container';
import dayjs from 'dayjs';
import { MetadataType } from '@models/Protocol/Entity';

export interface Params {
  id: string;
}

export default async (process: Process) => {
  const { id } = process.task.params as Params;

  const contractService = container.model.contractService();
  const metadataService = container.model.metadataService();

  const contract = await contractService.contractTable().where({ id }).first();
  if (!contract || contract.blockchain === 'waves') {
    throw new Error(`Contract "${id}" not found or incompatible`);
  }

  try {
    const network = container.blockchain[contract.blockchain].byNetwork(contract.network);
    const abi = await network.getContractAbi(contract.address);

    await metadataService.createOrUpdate(contract, MetadataType.EthereumContractAbi, abi);
  } catch (e) {
    return process.later(dayjs().add(10, 'seconds').toDate());
  }

  return process.done();
};
