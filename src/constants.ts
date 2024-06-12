import { Functions } from './types';

export const defaultFunctions: Functions = {
  internal: { tags: { dev: false, notice: true, return: true, param: true } },
  external: { tags: { dev: false, notice: true, return: true, param: true } },
  public: { tags: { dev: false, notice: true, return: true, param: true } },
  private: { tags: { dev: false, notice: true, return: true, param: true } },
} as const;

export const defaultTags = {
  tags: {
    dev: false,
    notice: true,
    param: true,
  },
} as const;
