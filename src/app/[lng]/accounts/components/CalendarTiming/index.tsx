import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./calendarTiming.module.scss";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useGetClientLng } from "@/hooks/useSystem";
import {
  getFullCalendarLang,
  getTransitionClassNames,
} from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { CSSTransition } from "react-transition-group";
import { DatesSetArg } from "@fullcalendar/core";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import CalendarTimingItem from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CalendarTimingItem";
import PublishDialog, { IPublishDialogRef } from "@/components/PublishDialog";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import { getPublishList } from "@/api/plat/publish";
import { PublishRecordItem } from "@/api/plat/types/publish.types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export interface ICalendarTimingRef {}
export interface ICalendarTimingProps {}

const CalendarTiming = memo(
  forwardRef(
    ({}: ICalendarTimingProps, ref: ForwardedRef<ICalendarTimingRef>) => {
      const lng = useGetClientLng();
      const calendarRef = useRef<FullCalendar | null>(null);
      const [animating, setAnimating] = useState(false);
      // 方向：'left'（下月）、'right'（上月）、'fade'（今天）
      const [direction, setDirection] = useState<"left" | "right" | "fade">(
        "left",
      );
      const { t } = useTransClient("account");
      const [currentDate, setCurrentDate] = useState<Date>(new Date());
      const handleDatesSet = (arg: DatesSetArg) => {
        const date = calendarRef.current?.getApi().getDate();
        if (date) {
          setCurrentDate(date);
        }
      };
      const calendarTimingCalendarRef = useRef<HTMLDivElement>(null);
      const [publishDialogOpen, setPublishDialogOpen] = useState(false);
      const { accountList } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
        })),
      );
      const { setCalendarCallWidth } = useCalendarTiming(
        useShallow((state) => ({
          setCalendarCallWidth: state.setCalendarCallWidth,
        })),
      );
      const calendarTimingItemCallEl = useRef<HTMLDivElement | null>(null);
      const publishDialogRef = useRef<IPublishDialogRef>(null);
      const [listLoading, setListLoading] = useState(false);
      // 发布记录数据，key=年月日，value=发布记录
      const [recordMap, setRecordMap] = useState<
        Map<string, PublishRecordItem[]>
      >(new Map());

      useEffect(() => {
        window.addEventListener("resize", handleResize);
        getPubRecord();

        setTimeout(() => {
          calendarTimingItemCallEl.current = document.querySelector(
            ".calendarTimingItem--js",
          )!;
          handleResize();
        }, 1);

        // 清理事件监听
        return () => window.removeEventListener("resize", handleResize);
      }, []);

      // 获取发布记录数据
      const getPubRecord = () => {
        setTimeout(async () => {
          setListLoading(true);
          const date = dayjs(calendarRef.current?.getApi().getDate());
          const startOfMonth = date.startOf("month");
          const endOfMonth = date.endOf("month");

          const res = await getPublishList({
            time: [startOfMonth.utc().format(), endOfMonth.utc().format()],
          });
          setListLoading(false);
          if (!res) return;
          const recordMap = new Map<string, PublishRecordItem[]>();
          // 将数据分拣到对应天中
          res?.data.map((v) => {
            const days = dayjs(v.publishTime);
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
          setRecordMap(recordMap);
        }, 10);
      };

      // 处理窗口大小变化
      const handleResize = () => {
        setTimeout(() => {
          const el = calendarTimingItemCallEl.current!;
          const style = window.getComputedStyle(el);
          const paddingLeft = parseFloat(style.paddingLeft);
          const paddingRight = parseFloat(style.paddingRight);

          setCalendarCallWidth(el.clientWidth - (paddingLeft + paddingRight));
        }, 100);
      };

      // 动画触发函数
      const triggerAnimation = (dir: "left" | "right" | "fade") => {
        calendarTimingCalendarRef.current!.scrollTop = 0;
        setDirection(dir);
        setAnimating(true);
      };

      // 点击上/下月按钮时
      const handlePrev = () => {
        triggerAnimation("right");
        setTimeout(() => {
          calendarRef.current?.getApi().prev();
          setAnimating(false);
          getPubRecord();
        }, 300);
      };
      const handleNext = () => {
        triggerAnimation("left");
        setTimeout(() => {
          calendarRef.current?.getApi().next();
          setAnimating(false);
          getPubRecord();
        }, 300);
      };
      // 点击Today按钮时
      const handleToday = () => {
        triggerAnimation("fade");
        setTimeout(() => {
          calendarRef.current?.getApi().today();
          setAnimating(false);
          getPubRecord();
        }, 300);
      };

      return (
        <div className={styles.calendarTiming}>
          <PublishDialog
            ref={publishDialogRef}
            open={publishDialogOpen}
            onClose={() => setPublishDialogOpen(false)}
            onPubSuccess={() => {
              getPubRecord();
            }}
            accounts={accountList}
          />

          <div className="calendarTiming-toolbar">
            <div className="calendarTiming-toolbar-left">
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={handlePrev}
              />
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={handleNext}
              />
              <h1>
                {currentDate.getFullYear()}-{currentDate.getMonth() + 1}
              </h1>
              <Button onClick={handleToday}>{t("today")}</Button>
            </div>
            <div className="calendarTiming-toolbar-right"></div>
          </div>
          <CSSTransition
            in={!animating}
            timeout={300}
            classNames={getTransitionClassNames(direction)}
            unmountOnExit
          >
            <div
              className="calendarTiming-calendar"
              ref={calendarTimingCalendarRef}
            >
              <DndProvider backend={HTML5Backend}>
                <FullCalendar
                  ref={calendarRef}
                  locale={getFullCalendarLang(lng)}
                  plugins={[dayGridPlugin]}
                  initialView="dayGridMonth"
                  initialDate={currentDate}
                  headerToolbar={false}
                  stickyFooterScrollbar={true}
                  dayCellContent={(arg) => {
                    const dateStr = dayjs(arg.date).format("YYYY-MM-DD");
                    return (
                      <CalendarTimingItem
                        key={dateStr}
                        records={recordMap.get(dateStr)}
                        loading={listLoading}
                        arg={arg}
                        onClickPub={(date) => {
                          publishDialogRef.current!.setPubTime(date);
                          setPublishDialogOpen(true);
                        }}
                      />
                    );
                  }}
                  datesSet={handleDatesSet}
                />
              </DndProvider>
            </div>
          </CSSTransition>
        </div>
      );
    },
  ),
);

export default CalendarTiming;
