export function watch(options: WatchOptions): () => void;

export type WatchOptions = {
  args?: string[];
  onError?: (filePaths: string[]) => void;
  onFinish?: () => void;
  onStart?: () => void;
  onSuccess?: () => void;
};
