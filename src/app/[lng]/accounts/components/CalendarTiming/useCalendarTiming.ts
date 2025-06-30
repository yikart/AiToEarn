import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";

export interface ICalendarTimingStore {
  // 日历单元格宽度
  calendarCallWidth: number;
}

const store: ICalendarTimingStore = {
  calendarCallWidth: 0,
};

const getStore = () => {
  return lodash.cloneDeep(store);
};

export const useCalendarTiming = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        setCalendarCallWidth(calendarCallWidth: number) {
          set({ calendarCallWidth });
        },

        clear() {
          set({
            ...getStore(),
          });
        },
      };
      return methods;
    },
  ),
);
