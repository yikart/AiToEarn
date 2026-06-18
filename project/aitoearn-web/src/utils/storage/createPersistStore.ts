import lodash from 'lodash'
import { create } from 'zustand'
import { combine, createJSONStorage, persist } from 'zustand/middleware'
import { indexedDBStorage } from './indexedDBStorage'
import { appLocalStorage } from './localStorage'

type Updater<T> = (updater: (value: T) => void) => void

type SecondParam<T> = T extends (_f: infer _F, _s: infer S, ...args: infer _U) => unknown ? S : never

interface MakeUpdater<T> {
  lastUpdateTime: number
  _hasHydrated: boolean

  markUpdate: () => void
  update: Updater<T>
  setHasHydrated: (state: boolean) => void
}

type SetStoreState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean | undefined,
) => void

type PersistStoreState<T extends object, M> = T & M & MakeUpdater<T>

/**
 * 创建一个数据持久化的 store
 * 想要更改的时候持久化数据必须使用 set 方法
 * @param state
 * @param methods
 * @param persistOptions
 * @param type
 */
export function createPersistStore<T extends object, M>(
  state: T,
  methods: (set: SetStoreState<T & MakeUpdater<T>>, get: () => T & MakeUpdater<T>) => M,
  persistOptions: SecondParam<typeof persist<T & M & MakeUpdater<T>>>,
  type: 'localStorage' | 'indexedDB' = 'indexedDB',
) {
  persistOptions.storage = createJSONStorage(() =>
    type === 'localStorage' ? appLocalStorage : indexedDBStorage,
  )
  const oldOonRehydrateStorage = persistOptions?.onRehydrateStorage
  persistOptions.onRehydrateStorage = (state) => {
    const oldOnRehydrateStorageCallback = oldOonRehydrateStorage?.(state)
    return (hydratedState, error) => {
      oldOnRehydrateStorageCallback?.(hydratedState, error)
      state.setHasHydrated(true)
    }
  }

  return create(
    persist(
      combine(
        {
          ...state,
          lastUpdateTime: 0,
          _hasHydrated: false,
        },
        (set, get) => {
          const setStoreState = set as unknown as SetStoreState<T & MakeUpdater<T>>
          const getStoreState = get as unknown as () => T & MakeUpdater<T>

          return {
            ...methods(setStoreState, getStoreState),

            markUpdate() {
              set({ lastUpdateTime: Date.now() } as Partial<T & M & MakeUpdater<T>>)
            },
            update(updater) {
              const state = lodash.cloneDeep(get())
              updater(state)
              set({
                ...state,
                lastUpdateTime: Date.now(),
              })
            },
            setHasHydrated: (state: boolean) => {
              set({ _hasHydrated: state } as Partial<T & M & MakeUpdater<T>>)
            },
          } as M & MakeUpdater<T>
        },
      ),
      persistOptions as never,
    ),
  )
}
