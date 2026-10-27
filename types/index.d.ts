export type Ask = { id: string; question: string; options: string[] }

declare module 'claude-code' {
  interface PluginState {
    'quick-answer': { asks: Shaped<Ask[]> }
  }
}
