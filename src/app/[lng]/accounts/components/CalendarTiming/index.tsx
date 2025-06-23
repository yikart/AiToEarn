import { ForwardedRef, forwardRef, memo, useRef, useState } from "react";
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

const events = [{ title: "Meeting", start: new Date() }];

function renderEventContent(eventInfo: any) {
  return (
    <>
      <b>{eventInfo.timeText}</b>
      <i>{eventInfo.event.title}</i>
    </>
  );
}

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

      // 动画触发函数
      const triggerAnimation = (dir: "left" | "right" | "fade") => {
        setDirection(dir);
        setAnimating(true);
      };

      // 点击上/下月按钮时
      const handlePrev = () => {
        triggerAnimation("right");
        setTimeout(() => {
          calendarRef.current?.getApi().prev();
          setAnimating(false);
        }, 300);
      };

      const handleNext = () => {
        triggerAnimation("left");
        setTimeout(() => {
          calendarRef.current?.getApi().next();
          setAnimating(false);
        }, 300);
      };

      // 点击Today按钮时
      const handleToday = () => {
        triggerAnimation("fade");
        setTimeout(() => {
          calendarRef.current?.getApi().today();
          setAnimating(false);
        }, 300);
      };

      return (
        <div className={styles.calendarTiming}>
          <div className="calendarTiming-toolbar">
            <Button type="text" icon={<LeftOutlined />} onClick={handlePrev} />
            <Button type="text" icon={<RightOutlined />} onClick={handleNext} />
            <h1>
              {currentDate.getFullYear()}-{currentDate.getMonth() + 1}
            </h1>
            <Button onClick={handleToday}>{t("today")}</Button>
          </div>
          <CSSTransition
            in={!animating}
            timeout={300}
            classNames={getTransitionClassNames(direction)}
            unmountOnExit
          >
            <div className="calendarTiming-calendar">
              <FullCalendar
                ref={calendarRef}
                locale={getFullCalendarLang(lng)}
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                initialDate={currentDate}
                headerToolbar={false}
                stickyFooterScrollbar={true}
                events={events}
                eventContent={renderEventContent}
                datesSet={handleDatesSet}
              />
            </div>
          </CSSTransition>
        </div>
      );
    },
  ),
);

export default CalendarTiming;
