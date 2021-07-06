import { Express, Request } from 'express';
import { Server } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { json } from 'body-parser';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { AuthEthereumMutation, UserType } from './schema/user';
import * as middlewares from './middlewares';
import {
  ProtocolCreateMutation,
  ProtocolDeleteMutation,
  ProtocolListQuery,
  ProtocolQuery,
  ProtocolUpdateMutation,
  ContractCreateMutation,
  ContractUpdateMutation,
  ContractDeleteMutation,
  ContractWalletLinkMutation,
  ContractWalletUnlinkMutation,
} from './schema/protocol';
import {
  ProposalCreateMutation,
  ProposalDeleteMutation,
  ProposalListQuery,
  ProposalQuery,
  ProposalUpdateMutation,
  UnvoteMutation,
  VoteMutation,
} from './schema/proposal';
import {
  UserContactEmailConfirmMutation,
  UserContactCreateMutation,
  UserContactDeleteMutation,
  UserContactListQuery,
  UserContactQuery
} from "@api/schema/notification";

export function route({ express, server }: { express: Express; server: Server }) {
  const apollo = new ApolloServer({
    schema: new GraphQLSchema({
      query: new GraphQLObjectType<undefined, Request>({
        name: 'Query',
        fields: {
          ping: {
            type: GraphQLNonNull(GraphQLString),
            resolve: () => 'pong',
          },
          me: {
            type: UserType,
            resolve: (root, args, { currentUser }) => currentUser,
          },
          protocol: ProtocolQuery,
          protocols: ProtocolListQuery,
          proposal: ProposalQuery,
          proposals: ProposalListQuery,
          userContact: UserContactQuery,
          userContacts: UserContactListQuery,
        },
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          authEth: AuthEthereumMutation,
          protocolCreate: ProtocolCreateMutation,
          protocolUpdate: ProtocolUpdateMutation,
          protocolDelete: ProtocolDeleteMutation,
          contractCreate: ContractCreateMutation,
          contractUpdate: ContractUpdateMutation,
          contractDelete: ContractDeleteMutation,
          contractWalletLink: ContractWalletLinkMutation,
          contractWalletUnlink: ContractWalletUnlinkMutation,
          proposalCreate: ProposalCreateMutation,
          proposalUpdate: ProposalUpdateMutation,
          proposalDelete: ProposalDeleteMutation,
          vote: VoteMutation,
          unvote: UnvoteMutation,
          userContactCreate: UserContactCreateMutation,
          userContactEmailConfirm: UserContactEmailConfirmMutation,
          userContactDelete: UserContactDeleteMutation,
        },
      }),
    }),
    subscriptions: '/api',
    playground: true,
    context: ({ req }) => req,
  });
  apollo.installSubscriptionHandlers(server);
  express.use('/api', [
    json(),
    middlewares.currentUser,
    middlewares.i18n,
    middlewares.acl,
    apollo.getMiddleware({ path: '/' }),
  ]);
}
