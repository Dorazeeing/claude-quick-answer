import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'quick-answer',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

const ASK = { tool: 'mcp__quick-answer__ask' as const, question: '명세 다시 띄울까?', options: ['전체', '할 일만', '안 띄움'] }

test('a pick submits the answer and takes the question down', async ($, on) => {
  const sent: string[] = []
  on('prompt.submit', (_, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  // Stands for the engine's own band, drawn once no question waits.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const asked = await $.tool.call(ASK)
  expect(asked.result).toBeDefined()

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /명세/ }))?.text).toBe('명세 다시 띄울까?')
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(4)

  await ui.press({ key: 'pick-2' })
  expect(sent).toEqual(['명세 다시 띄울까? → 2: 할 일만'])
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
  await ui.unmount()
})

test('a dismissal sends nothing, and the next question shows', async ($, on) => {
  const sent: string[] = []
  on('prompt.submit', (_, e) => {
    sent.push(e.text)
    return { text: e.text }
  })

  await $.tool.call(ASK)
  await $.tool.call({ ...ASK, question: '테스트도 돌릴까?', options: ['예', '아니오'] })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /\+1/ }))?.text).toContain('+1')

  await ui.press({ key: 'dismiss' })
  expect(sent).toEqual([])
  expect((await ui.find({ type: 'Text', text: /테스트도/ }))?.text).toBe('테스트도 돌릴까?')
  await ui.unmount()
})

test('a survey keeps the band', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>survey</Text>
  })

  await $.tool.call(ASK)
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, hasSurvey: true }, surface: 'terminal' })

  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
  await ui.unmount()
})

test('a malformed call is refused', async $ => {
  const refused = await $.tool.call({ tool: 'mcp__quick-answer__ask', question: '?', options: ['하나'] })

  expect(refused.deny).toBeDefined()
})
