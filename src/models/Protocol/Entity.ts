import { tableFactoryLegacy, typedTableFactory } from '@services/Database';
import { Blockchain } from '@models/types';

export interface ProtocolLink {
  id: string;
  name: string;
  value: string;
}

export interface ProtocolLinkMap {
  social?: ProtocolLink[];
  listing?: ProtocolLink[];
  audit?: ProtocolLink[];
  other?: ProtocolLink[];
}

export interface Protocol {
  id: string;
  adapter: string;
  name: string;
  description: string;
  icon: string | null;
  link: string | null;
  links: ProtocolLinkMap;
  debankId: string | null;
  hidden: boolean;
  metric: { tvl?: string };
  updatedAt: Date;
  createdAt: Date;
  previewPicture: string | null;
}

export const protocolTableName = 'protocol';

export const protocolTableFactory = typedTableFactory(protocolTableName);

export type ProtocolTable = ReturnType<ReturnType<typeof protocolTableFactory>>;

export interface ProtocolUserFavorite {
  id: string;
  protocol: string;
  user: string;
  createdAt: Date;
}

export const protocolUserFavoriteTableName = 'protocol_user_favorite';

export const protocolUserFavoriteTableFactory = typedTableFactory(protocolUserFavoriteTableName);

export type ProtocolUserFavoriteTable = ReturnType<
  ReturnType<typeof protocolUserFavoriteTableFactory>
>;

export interface ContractAutomate {
  autorestakeAdapter?: string;
  adapters: string[];
  buyLiquidity?: {
    router: string;
    pair: string;
  };
}

export interface ContractMetric {
  tvl?: string;
  aprDay?: string;
  aprWeek?: string;
  aprMonth?: string;
  aprYear?: string;
  aprWeekReal?: string;
}

export interface Contract {
  id: string;
  protocol: string;
  layout: string;
  name: string;
  description: string;
  link: string | null;
  hidden: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface ContractDebankType {
  id: string;
  address: string;
  metric: ContractMetric;
}

export interface ContractBlockchainType {
  id: string;
  blockchain: Blockchain;
  network: string;
  address: string;
  deployBlockNumber: string | null;
  adapter: string;
  automate: ContractAutomate;
  metric: ContractMetric;
}

export const contractTableName = 'protocol_contract';
export const contractTableFactory = typedTableFactory(contractTableName);
export type ContractTable = ReturnType<ReturnType<typeof contractTableFactory>>;

export const contractDebankTableName = 'protocol_contract_debank';
export const contractDebankTableFactory = typedTableFactory(contractDebankTableName);
export type ContractDebankTable = ReturnType<ReturnType<typeof contractDebankTableFactory>>;

export const contractBlockchainTableName = 'protocol_contract_blockchain';
export const contractBlockchainTableFactory = typedTableFactory(contractBlockchainTableName);
export type ContractBlockchainTable = ReturnType<ReturnType<typeof contractBlockchainTableFactory>>;

export interface WalletContractLink {
  id: string;
  contract: string;
  wallet: string;
  createdAt: Date;
}

export const walletContractLinkTableName = 'protocol_contract_wallet_link';
export const walletContractLinkTableFactory = typedTableFactory(walletContractLinkTableName);
export type WalletContractLinkTable = ReturnType<ReturnType<typeof walletContractLinkTableFactory>>;

export enum MetadataType {
  EthereumContractAbi = 'ethereumContractAbi',
}
export interface Metadata {
  id: string;
  contract: string;
  type: MetadataType;
  value: { value: any };
  createdAt: Date;
}

export const metadataTableName = 'protocol_contract_metadata';

export const metadataTableFactory = typedTableFactory(metadataTableName);

export type MetadataTable = ReturnType<ReturnType<typeof metadataTableFactory>>;

export enum TokenContractLinkType {
  Stake = 'stake',
  Reward = 'reward',
}

export interface TokenContractLink {
  id: string;
  contract: string;
  token: string;
  type: TokenContractLinkType;
  createdAt: Date;
}

export const tokenContractLinkTableName = 'protocol_contract_token_link';

export const tokenContractLinkTableFactory = tableFactoryLegacy<TokenContractLink>(
  tokenContractLinkTableName,
);

export type TokenContractLinkTable = ReturnType<ReturnType<typeof tokenContractLinkTableFactory>>;

declare module 'knex/types/tables' {
  interface Tables {
    [protocolTableName]: Protocol;
    [metadataTableName]: Metadata;
    [contractTableName]: Contract;
    [walletContractLinkTableName]: WalletContractLink;
    [protocolUserFavoriteTableName]: ProtocolUserFavorite;
    [contractDebankTableName]: ContractDebankType;
    [contractBlockchainTableName]: ContractBlockchainType;
  }
}
