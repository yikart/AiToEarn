import { create } from "zustand";
import { combine } from "zustand/middleware";
import lodash from "lodash";
import { PublishRecordItem } from "@/api/plat/types/publish.types";
import { getPublishList } from "@/api/plat/publish";
import FullCalendar from "@fullcalendar/react";
import { getDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { useAccountStore } from "@/store/account";

export interface ICalendarTimingStore {
  // 日历单元格宽度
  calendarCallWidth: number;
  // 发布记录数据，key=年月日，value=发布记录
  recordMap: Map<string, PublishRecordItem[]>;
  // 请求发布记录loading
  listLoading: boolean;
  // 当前日历ref
  calendarRef?: FullCalendar;
}

const store: ICalendarTimingStore = {
  calendarCallWidth: 0,
  recordMap: new Map(),
  listLoading: false,
  calendarRef: undefined,
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
        setRecordMap(recordMap: Map<string, PublishRecordItem[]>) {
          set({ recordMap });
        },
        setListLoading(listLoading: boolean) {
          set({ listLoading });
        },
        setCalendarRef(calendarRef: FullCalendar) {
          set({ calendarRef });
        },

        // 获取发布记录数据
        async getPubRecord() {
          try {
            methods.setListLoading(true);
            const date = getDays(get().calendarRef?.getApi().getDate() || new Date());
            const startOfMonth = date.startOf("month");
            const endOfMonth = date.endOf("month");

            const res = await getPublishList({
              time: [startOfMonth.utc().format(), endOfMonth.utc().format()],
              accountType: useAccountStore.getState().accountActive?.type,
            });
            methods.setListLoading(false);
            
            // 检查响应数据是否有效
            if (!res || !res.data || !Array.isArray(res.data)) {
              console.warn('获取发布记录数据失败或数据格式不正确:', res);
              methods.setRecordMap(new Map());
              return;
            }
            
            const recordMap = new Map<string, PublishRecordItem[]>();
            // 将数据分拣到对应天中
            res.data.map((v) => {
              const days = getDays(v.publishTime);
              const timeStr = days.format("YYYY-MM-DD");
              let list = recordMap.get(timeStr);
              if (!list) {
                list = [];
                recordMap.set(timeStr, list);
              }
              list.push(v);
              recordMap.set(timeStr, list);
            });
            // 对每一天的记录按照 publishTime 时间从早到晚排序
            recordMap.forEach((v, k) => {
              let list = recordMap.get(k);
              if (list) {
                list = list.sort(
                  (a, b) =>
                    new Date(a.publishTime).getTime() -
                    new Date(b.publishTime).getTime(),
                );
                recordMap.set(k, list);
              }
            });
            methods.setRecordMap(recordMap);
          } catch (error) {
            console.error('获取发布记录数据时发生错误:', error);
            methods.setListLoading(false);
            methods.setRecordMap(new Map());
          }
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
