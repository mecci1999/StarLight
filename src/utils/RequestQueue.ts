type QueuedRequest = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
  timestamp: number
  priority?: number
}

export class RequestQueue {
  private readonly maxSize: number = 100 // 队列最大容量
  private readonly maxConcurrent: number = 5 // 最大并发数
  private queue: QueuedRequest[] = [] // 请求队列
  private processing: number = 0 // 当前正在处理的请求数

  /**
   * 将请求添加到队列中
   * @param resolve 请求的回调函数
   * @param priority 优先级，数字越小优先级越高
   */
  enqueue(resolve: (token: string) => void, reject: (error: unknown) => void, priority: number = 0): void {
    if (this.queue.length >= this.maxSize) {
      console.warn('🚫 请求队列已满，丢弃新请求')
      reject(new Error('请求队列已满'))
      return
    }

    // 按优先级和时间戳排序插入
    const request = {
      resolve,
      reject,
      timestamp: Date.now(),
      priority
    }

    // 按优先级,找到插入位置
    const insertIndex = this.queue.findIndex((item) => item.priority! < priority)

    if (insertIndex === -1) {
      this.queue.push(request)
    } else {
      this.queue.splice(insertIndex, 0, request)
    }
  }

  /**
   * 从队列中取出请求并执行
   */
  async processQueue(token: string): Promise<void> {
    console.log(`⏳ 开始处理队列中的 ${this.queue.length} 个请求`)

    while (this.queue.length > 0 && this.processing < this.maxConcurrent) {
      this.processing++

      const request = this.queue.shift()
      if (request) {
        try {
          console.log(`🔄 处理请求 - 剩余 ${this.queue.length} 个`)
          await request.resolve(token)
        } catch (error) {
          console.error('❌ 请求处理出错:', error)
        } finally {
          this.processing--
        }
      }

      // 控制请求间隔
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  /**
   * 清空对列
   */
  clear(error?: unknown): void {
    if (error) {
      this.queue.forEach((request) => {
        try {
          request.reject(error)
        } catch (rejectError) {
          console.error('❌ 队列请求拒绝出错:', rejectError)
        }
      })
    }
    this.queue = []
    this.processing = 0
  }

  /**
   * 获取队列长度
   */
  get size(): number {
    return this.queue.length
  }
}
