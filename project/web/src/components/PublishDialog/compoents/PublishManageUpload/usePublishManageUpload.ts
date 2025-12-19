import type {
  IPublishManageUploadState,
  StartUploadOptions,
  UploadCacheItem,
  UploadResult,
  UploadRuntime,
  UploadTask,
} from './usePublishManageUpload.type'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { uploadToOss } from '@/api/oss'
import {
  computeFileMd5,
  createTaskId,
  isAbortError,
} from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload.utils'
import { UploadTaskStatusEnum } from './publishManageUpload.enum'
import { getOssUrl } from '@/utils/oss'

// 仅定义状态形状，方法类型走类型推断
const initialState: IPublishManageUploadState = {
  tasks: {},
  md5Cache: {},
}

function getStore() {
  return lodash.cloneDeep(initialState)
}

const uploadRuntimeMap = new Map<string, UploadRuntime>()
const taskMd5Map = new Map<string, string>()
const canceledTasks = new Set<string>()

// 管理发布弹框的上传任务（去重/进度/取消/缓存）
export const usePublishManageUpload = create(
  combine(initialState, (set, get) => {
    /**
     * 批量更新相同 MD5 的任务进度/状态
     * - 仅在任务处于进行中时更新
     */
    const updateTasksForMd5 = (
      md5: string,
      updater: (task: UploadTask) => UploadTask | null,
    ) => {
      set((state) => {
        let mutated = false
        const nextTasks: Record<string, UploadTask> = { ...state.tasks }

        for (const [id, task] of Object.entries(state.tasks)) {
          if (task.md5 !== md5)
            continue
          const updated = updater(task)
          if (updated && updated !== task) {
            nextTasks[id] = updated
            mutated = true
          }
        }

        return mutated ? { tasks: nextTasks } : state
      })
    }

    /**
     * 确保为同一个 MD5 创建并复用唯一 runtime
     * - 统一进度回调
     * - 统一终止控制
     */
    const ensureRuntime = (md5: string, file: Blob): UploadRuntime => {
      let runtime = uploadRuntimeMap.get(md5)
      if (runtime) {
        return runtime
      }

      const controller = new AbortController()
      runtime = {
        controller,
        progress: 0,
        taskIds: new Set<string>(),
        completed: false,
        // 占位，实际 promise 下面会重写
        promise: Promise.resolve({ ossKey: '', ossUrl: '' }),
      }

      uploadRuntimeMap.set(md5, runtime)

      runtime.promise = uploadToOss(file, {
        signal: controller.signal,
        onProgress: (prog) => {
          runtime!.progress = prog
          updateTasksForMd5(md5, (task) => {
            if (
              task.status === UploadTaskStatusEnum.Canceled
              || task.status === UploadTaskStatusEnum.Error
              || task.status === UploadTaskStatusEnum.Success
            ) {
              return null
            }
            return {
              ...task,
              status: UploadTaskStatusEnum.Uploading,
              progress: prog >= 100 ? 99 : prog,
              updatedAt: Date.now(),
            }
          })
        },
      })
        .then((ossKey) => {
          runtime!.completed = true
          const result: UploadCacheItem = {
            ossKey,
            ossUrl: `${getOssUrl(ossKey)}`,
          }

          set(state => ({
            md5Cache: {
              ...state.md5Cache,
              [md5]: result,
            },
          }))

          return result
        })
        .catch((error) => {
          runtime!.completed = true
          throw error
        })
        .finally(() => {
          uploadRuntimeMap.delete(md5)
        })

      return runtime
    }

    /** 合并更新单个任务 */
    const finalizeTask = (taskId: string, patch: Partial<UploadTask>) => {
      set((state) => {
        const task = state.tasks[taskId]
        if (!task)
          return state
        return {
          tasks: {
            ...state.tasks,
            [taskId]: {
              ...task,
              ...patch,
              updatedAt: Date.now(),
            },
          },
        }
      })
    }

    /** 释放 runtime 的一个引用（最后一个释放会中止上传） */
    const releaseRuntime = (taskId: string, md5?: string) => {
      if (!md5)
        return
      const runtime = uploadRuntimeMap.get(md5)
      runtime?.taskIds.delete(taskId)

      if (runtime && runtime.taskIds.size === 0 && !runtime.completed) {
        runtime.controller.abort()
      }
    }

    // 将任务放到队列
    const enqueueUpload = ({
      file,
      type,
      fileName,
      taskId: providedTaskId,
    }: StartUploadOptions) => {
      const taskId = providedTaskId ?? createTaskId()
      const name = fileName ?? (file as File)?.name ?? ''

      set(state => ({
        tasks: {
          ...state.tasks,
          [taskId]: {
            id: taskId,
            fileName: name,
            size: file.size ?? 0,
            type,
            status: UploadTaskStatusEnum.Hashing,
            progress: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      }))

      const promise = (async (): Promise<UploadResult> => {
        let currentMd5: string | undefined
        try {
          const md5 = await computeFileMd5(file)
          currentMd5 = md5

          if (canceledTasks.has(taskId)) {
            throw new DOMException('Upload canceled', 'AbortError')
          }

          taskMd5Map.set(taskId, md5)

          finalizeTask(taskId, {
            md5,
            status: UploadTaskStatusEnum.Pending,
          })

          const cache = get().md5Cache[md5]
          if (cache) {
            const result: UploadResult = { ...cache, fromCache: true }
            finalizeTask(taskId, {
              status: UploadTaskStatusEnum.Success,
              progress: 100,
              fromCache: true,
            })
            return result
          }

          const runtime = ensureRuntime(md5, file)
          runtime.taskIds.add(taskId)

          if (runtime.progress > 0) {
            updateTasksForMd5(md5, (task) => {
              if (task.id !== taskId)
                return null
              if (
                task.status === UploadTaskStatusEnum.Canceled
                || task.status === UploadTaskStatusEnum.Error
              ) {
                return null
              }
              return {
                ...task,
                status: UploadTaskStatusEnum.Uploading,
                progress: runtime.progress >= 100 ? 99 : runtime.progress,
                updatedAt: Date.now(),
              }
            })
          }

          const result = await runtime.promise

          if (canceledTasks.has(taskId)) {
            throw new DOMException('Upload canceled', 'AbortError')
          }

          const uploadResult: UploadResult = {
            ...result,
            fromCache: false,
          }

          finalizeTask(taskId, {
            status: UploadTaskStatusEnum.Success,
            progress: 100,
            fromCache: false,
          })

          return uploadResult
        }
        catch (error) {
          const aborted = isAbortError(error)

          finalizeTask(taskId, {
            status: aborted
              ? UploadTaskStatusEnum.Canceled
              : UploadTaskStatusEnum.Error,
            errorMessage:
              aborted || !(error instanceof Error) ? undefined : error.message,
          })

          throw error
        }
        finally {
          const md5 = currentMd5 ?? taskMd5Map.get(taskId)
          releaseRuntime(taskId, md5)
          taskMd5Map.delete(taskId)
          canceledTasks.delete(taskId)
        }
      })()

      const cancel = () => {
        if (canceledTasks.has(taskId)) {
          return
        }

        canceledTasks.add(taskId)

        const md5 = taskMd5Map.get(taskId)
        releaseRuntime(taskId, md5)

        finalizeTask(taskId, {
          status: UploadTaskStatusEnum.Canceled,
        })
      }

      return {
        taskId,
        promise,
        cancel,
      }
    }

    return {
      ...getStore(),
      enqueueUpload,
      cancelUpload: (taskId: string) => {
        if (!taskId)
          return
        if (canceledTasks.has(taskId))
          return

        canceledTasks.add(taskId)

        const md5 = taskMd5Map.get(taskId)
        releaseRuntime(taskId, md5)

        finalizeTask(taskId, {
          status: UploadTaskStatusEnum.Canceled,
        })
      },
      removeTask: (taskId: string) => {
        canceledTasks.delete(taskId)
        taskMd5Map.delete(taskId)

        set((state) => {
          if (!(taskId in state.tasks)) {
            return state
          }
          const { [taskId]: _removed, ...rest } = state.tasks
          return { tasks: rest }
        })
      },
      updateTask: (taskId: string, patch: Partial<UploadTask>) => {
        finalizeTask(taskId, patch)
      },
    }
  }),
)
