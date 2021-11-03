import axios, { AxiosInstance } from 'axios';

export enum SocialProvider {
  Telegram = 'telegram',
}

export enum CoinProvider {
  CoinGecko = 'coingecko',
  CoinMarketCap = 'coinmarketcap',
}

export enum PostProvider {
  Medium = 'medium',
  Twitter = 'twitter',
}

export interface Options {
  host: string;
}

export class SocialStatsGateway {
  protected client: AxiosInstance;

  constructor({ host }: Options) {
    this.client = axios.create({
      baseURL: host,
    });
  }

  async social(provider: SocialProvider, channel: string) {
    const res = await this.client.get<{ followers: number }>(
      `/api/v1/follower/${provider}/${channel}`,
    );

    return res.data;
  }

  async coin(provider: CoinProvider, id: string) {
    const res = await this.client.get<{ watchers: number }>(`/api/v1/coin/${provider}/${id}`);

    return res.data;
  }

  async post(provider: PostProvider, id: string) {
    const res = await this.client.get<
      Array<{
        title: string;
        text: string;
        link: string;
        createdAt: number;
      }>
    >(`/api/v1/post/${provider}/${id}`);

    return res.data;
  }
}
