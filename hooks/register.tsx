import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Ask } from '../types'

const TOOL = 'mcp__quick-answer__ask'

// The questions waiting above the prompt, oldest first. Each stays until the
// person presses one of its digits; their other prompts leave it alone.
const asks = atom({ plugin: 'quick-answer', key: 'asks' } as const, [] as Ask[], {
  shape: 'asks-1',
})

const GUIDE = {
  id: 'quick-answer:guide',
  scope: 'session',
  text: `When the person only needs to pick one of a few short answers (a preference, an optional follow-up, "which of these next?"), ask with the ${TOOL} tool rather than writing a numbered choice line or calling AskUserQuestion. Keep AskUserQuestion for several related questions at once or answers that need previews.`,
} as const

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'ask',
      description: [
        'Asks the person one single-choice question in the band above the prompt, the way the session survey does.',
        'It stays up while you keep working and while they send other prompts, until they press a digit: 1 to n picks an option, 0 dismisses. No Enter.',
        'Returns at once. Their pick arrives later as a message of theirs reading "<question> → <n>: <option>"; a dismissal sends nothing.',
        'If you cannot go on without the answer, end your turn after calling it.',
      ].join(' '),
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'One short line, ending in a question mark.' },
          options: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 9,
            description: 'Short labels, in the order of their digits 1 to n. Do not add a skip option: 0 always dismisses.',
          },
        },
        required: ['question', 'options'],
      },
      isDeferred: false,
    })

    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)

    return { ...composed, sections: [...composed.sections, GUIDE] }
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const { question, options } = e as { question?: unknown; options?: unknown }
    const labels = Array.isArray(options) ? options.filter((o): o is string => typeof o === 'string' && o.trim() !== '') : []
    if (typeof question !== 'string' || question.trim() === '' || labels.length < 2 || labels.length > 9) {
      return { deny: 'Give a non-empty question and 2 to 9 non-empty option labels.' }
    }

    const ask: Ask = { id: e.tool_use_id ?? crypto.randomUUID(), question: question.trim(), options: labels.map(l => l.trim()) }
    await update($, asks, list => [...list, ask])

    return { result: 'Shown above the prompt. The answer arrives as a later message from the person, or not at all if they dismiss it.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const [ask, ...rest] = await read($, asks)
    if (e.props.hasSurvey || ask === undefined) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Text>
          <Text bold>{ask.question}</Text>
          {rest.length > 0 && <Text dimColor>{`  (+${rest.length})`}</Text>}
        </Text>
        <Box columnGap={4}>
          {ask.options.map((label, i) => (
            <Button key={`pick-${i + 1}`} hotkey={String(i + 1)} plain onPress={() => answer($, ask, i)}>
              {label}
            </Button>
          ))}
          <Button key="dismiss" hotkey="0" plain role="dismiss" onPress={() => answer($, ask, undefined)}>
            Dismiss
          </Button>
        </Box>
      </Box>
    )
  })
}

// Takes the question down; a pick (not a dismissal) goes to the model as the person's reply.
async function answer($: EngineInterface, ask: Ask, index: number | undefined) {
  await update($, asks, list => list.filter(a => a.id !== ask.id))
  if (index === undefined) return

  await $.prompt.submit({ text: `${ask.question} → ${index + 1}: ${ask.options[index]}`, asUser: true })
}
