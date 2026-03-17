import type { Queue } from 'bullmq'
import { getQueueToken } from '@nestjs/bullmq'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { QueueEvents } from 'bullmq'
import { Counter, Gauge, Summary } from 'prom-client'
import { QueueName } from './enums'
import { QueueConfig } from './queue.config'

const CALIBRATION_INTERVAL = 5 * 60 * 1000

@Injectable()
export class QueueMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMetricsService.name)
  private readonly queues: Array<{ name: string, queue: Queue }> = []
  private readonly queueEventsInstances: QueueEvents[] = []
  private calibrationTimer?: ReturnType<typeof setInterval>

  private readonly jobCountGauge = new Gauge({
    name: 'bullmq_job_count',
    help: 'Number of jobs in the queue by state',
    labelNames: ['queue', 'state'] as const,
  })

  private readonly activeCounter = new Counter({
    name: 'bullmq_jobs_active',
    help: 'Total number of jobs started processing',
    labelNames: ['queue'] as const,
  })

  private readonly completedCounter = new Counter({
    name: 'bullmq_jobs_completed',
    help: 'Total number of completed jobs',
    labelNames: ['queue'] as const,
  })

  private readonly failedCounter = new Counter({
    name: 'bullmq_jobs_failed',
    help: 'Total number of failed jobs',
    labelNames: ['queue'] as const,
  })

  private readonly durationSummary = new Summary({
    name: 'bullmq_job_duration_milliseconds',
    help: 'Job processing duration in milliseconds',
    labelNames: ['queue', 'status'] as const,
    percentiles: [0.5, 0.9, 0.95, 0.99],
    maxAgeSeconds: 600,
    ageBuckets: 5,
  })

  private readonly waitDurationSummary = new Summary({
    name: 'bullmq_job_wait_duration_milliseconds',
    help: 'Job wait time in queue before processing in milliseconds',
    labelNames: ['queue', 'status'] as const,
    percentiles: [0.5, 0.9, 0.95, 0.99],
    maxAgeSeconds: 600,
    ageBuckets: 5,
  })

  private readonly attemptsSummary = new Summary({
    name: 'bullmq_job_attempts',
    help: 'Number of attempts per job',
    labelNames: ['queue', 'status'] as const,
    percentiles: [0.5, 0.9, 0.95, 0.99],
    maxAgeSeconds: 600,
    ageBuckets: 5,
  })

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly config: QueueConfig,
  ) {}

  async onModuleInit() {
    for (const name of Object.values(QueueName)) {
      try {
        const token = getQueueToken(name)
        const queue = this.moduleRef.get<Queue>(token, { strict: false })
        if (queue) {
          this.queues.push({ name, queue })
        }
      }
      catch {
        this.logger.warn(`Queue ${name} not found in module context`)
      }
    }
    this.logger.log(`Registered ${this.queues.length} queues for metrics collection`)

    await this.calibrateJobCounts()
    this.setupQueueEvents()
    this.calibrationTimer = setInterval(() => this.calibrateJobCounts(), CALIBRATION_INTERVAL)
  }

  async onModuleDestroy() {
    if (this.calibrationTimer) {
      clearInterval(this.calibrationTimer)
    }
    await Promise.allSettled(
      this.queueEventsInstances.map(qe => qe.close()),
    )
  }

  private setupQueueEvents() {
    const redisConnection = this.buildRedisConnection()

    for (const { name, queue } of this.queues) {
      try {
        const queueEvents = new QueueEvents(name, {
          connection: redisConnection,
          prefix: this.config.prefix,
        })

        queueEvents.on('active', ({ prev }) => {
          this.activeCounter.labels(name).inc()
          this.transitionJobCount(name, prev, 'active')
        })

        queueEvents.on('completed', async ({ jobId, prev }) => {
          this.completedCounter.labels(name).inc()
          this.transitionJobCount(name, prev, 'completed')
          await this.observeJobMetrics(name, queue, jobId, 'completed')
        })

        queueEvents.on('failed', async ({ jobId, prev }) => {
          this.failedCounter.labels(name).inc()
          this.transitionJobCount(name, prev, 'failed')
          await this.observeJobMetrics(name, queue, jobId, 'failed')
        })

        queueEvents.on('waiting', ({ prev }) => {
          this.transitionJobCount(name, prev, 'waiting')
        })

        queueEvents.on('delayed', () => {
          this.jobCountGauge.labels(name, 'delayed').inc()
        })

        queueEvents.on('paused', () => {
          this.jobCountGauge.labels(name, 'paused').inc()
        })

        queueEvents.on('waiting-children', () => {
          this.jobCountGauge.labels(name, 'waiting-children').inc()
        })

        this.queueEventsInstances.push(queueEvents)
      }
      catch (error) {
        this.logger.warn(`Failed to create QueueEvents for ${name}: ${error}`)
      }
    }

    this.logger.log(`Created ${this.queueEventsInstances.length} QueueEvents listeners`)
  }

  private transitionJobCount(queueName: string, prev: string | undefined, next: string) {
    if (prev) {
      this.jobCountGauge.labels(queueName, prev).dec()
    }
    this.jobCountGauge.labels(queueName, next).inc()
  }

  private async observeJobMetrics(queueName: string, queue: Queue, jobId: string, status: string) {
    try {
      const job = await queue.getJob(jobId)
      if (!job)
        return

      if (job.processedOn && job.finishedOn) {
        this.durationSummary.labels(queueName, status).observe(job.finishedOn - job.processedOn)
      }
      if (job.processedOn && job.timestamp) {
        this.waitDurationSummary.labels(queueName, status).observe(job.processedOn - job.timestamp)
      }
      this.attemptsSummary.labels(queueName, status).observe(job.attemptsMade)
    }
    catch {
    }
  }

  private async calibrateJobCounts() {
    this.jobCountGauge.reset()
    await Promise.allSettled(
      this.queues.map(async ({ name, queue }) => {
        const counts = await queue.getJobCounts()
        for (const [state, count] of Object.entries(counts)) {
          this.jobCountGauge.labels(name, state).set(count)
        }
      }),
    )
  }

  private buildRedisConnection() {
    const redis = this.config.redis
    if ('nodes' in redis) {
      const node = redis.nodes[0]
      return {
        host: node?.host ?? 'localhost',
        port: Number(node?.post ?? 6379),
        ...redis.options?.redisOptions,
      }
    }
    return {
      host: redis.host ?? 'localhost',
      port: redis.port ?? 6379,
      username: redis.username,
      password: redis.password,
      db: redis.db,
      tls: redis.tls,
    }
  }
}
