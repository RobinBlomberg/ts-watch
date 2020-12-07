/*
 * Internal types
 * -------------------------------------------------------------------------------------------------
 */

export type WatchOptions = {
  args?: string[];
  onError?: (filePaths: string[]) => void;
  onFinish?: () => void;
  onStart?: () => void;
  onSuccess?: () => void;
};

/*
 * External types
 * -------------------------------------------------------------------------------------------------
 */

export function watch(options: WatchOptions): () => void;
