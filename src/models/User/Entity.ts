import { tableFactoryLegacy } from '@services/Database';
import { Locale } from '@services/I18n/container';

export enum Role {
  User = 'user',
  Admin = 'admin',
}

export interface User {
  id: string;
  role: Role;
  locale: Locale;
  updatedAt: Date;
  createdAt: Date;
}

export const tableName = 'user';

export const tableFactory = tableFactoryLegacy<User>(tableName);

export type Table = ReturnType<ReturnType<typeof tableFactory>>;
