/// <reference types="vite/client" />

// File Handling API (Chromium). Findes ikke i TypeScripts DOM-typer endnu.
interface LaunchParams {
  readonly files: readonly FileSystemFileHandle[];
  readonly targetURL?: string;
}

interface LaunchQueue {
  setConsumer(consumer: (params: LaunchParams) => void): void;
}

interface Window {
  readonly launchQueue?: LaunchQueue;
}
