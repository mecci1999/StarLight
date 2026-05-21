import { describe, it, expect } from 'vitest'
import { RequestQueue } from '../RequestQueue'

describe('RequestQueue', () => {
  it('tracks queue size and clears', () => {
    const queue = new RequestQueue()
    expect(queue.size).toBe(0)
    queue.enqueue(
      () => Promise.resolve(),
      () => {}
    )
    queue.enqueue(
      () => Promise.resolve(),
      () => {}
    )
    expect(queue.size).toBe(2)
    queue.clear()
    expect(queue.size).toBe(0)
  })

  it('processes queued items', async () => {
    const queue = new RequestQueue()
    const tokens: string[] = []
    queue.enqueue(
      (token: string) => {
        tokens.push(token)
        return Promise.resolve()
      },
      () => {}
    )
    await queue.processQueue('token-1')
    expect(tokens).toEqual(['token-1'])
    expect(queue.size).toBe(0)
  })
})
