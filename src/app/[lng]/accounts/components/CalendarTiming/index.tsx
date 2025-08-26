import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import styles from "./calendarTiming.module.scss";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useGetClientLng } from "@/hooks/useSystem";
import {
  getDays,
  getFullCalendarLang,
  getTransitionClassNames,
} from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { CSSTransition } from "react-transition-group";
import { DatesSetArg } from "@fullcalendar/core";
import { Button, Tabs } from "antd";
import { LeftOutlined, PlusOutlined, RightOutlined, CalendarOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import CalendarTimingItem from "@/app/[lng]/accounts/components/CalendarTiming/CalendarTimingItem/CalendarTimingItem";
import PublishDialog, { IPublishDialogRef } from "@/components/PublishDialog";
import { useAccountStore } from "@/store/account";
import { useShallow } from "zustand/react/shallow";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { useCalendarTiming } from "@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming";
import AvatarPlat from "@/components/AvatarPlat";
import AllPlatIcon from "@/app/[lng]/accounts/components/CalendarTiming/AllPlatIcon";
import ListMode from "@/app/[lng]/accounts/components/CalendarTiming/ListMode";

export interface ICalendarTimingRef {}
export interface ICalendarTimingProps {}

const CalendarTiming = memo(
  forwardRef(
    ({}: ICalendarTimingProps, ref: ForwardedRef<ICalendarTimingRef>) => {
      const lng = useGetClientLng();
      const searchParams = useSearchParams();
      const calendarRef = useRef<FullCalendar | null>(null);
      const [animating, setAnimating] = useState(false);
      // 方向：'left'（下月）、'right'（上月）、'fade'（今天）
      const [direction, setDirection] = useState<"left" | "right" | "fade">(
        "left",
      );
      const { t } = useTransClient("account");
      const [currentDate, setCurrentDate] = useState<Date>(new Date());
      const [activeMode, setActiveMode] = useState<"calendar" | "list">("calendar");
      const handleDatesSet = (arg: DatesSetArg) => {
        const date = calendarRef.current?.getApi().getDate();
        if (date) {
          setCurrentDate(date);
        }
      };
      const calendarTimingCalendarRef = useRef<HTMLDivElement>(null);
      const [publishDialogOpen, setPublishDialogOpen] = useState(false);
      const { accountList, accountActive } = useAccountStore(
        useShallow((state) => ({
          accountList: state.accountList,
          accountActive: state.accountActive,
        })),
      );
      const {
        setCalendarCallWidth,
        listLoading,
        recordMap,
        setCalendarRef,
        getPubRecord,
      } = useCalendarTiming(
        useShallow((state) => ({
          setCalendarCallWidth: state.setCalendarCallWidth,
          listLoading: state.listLoading,
          recordMap: state.recordMap,
          getPubRecord: state.getPubRecord,
          setCalendarRef: state.setCalendarRef,
        })),
      );
      const calendarTimingItemCallEl = useRef<HTMLDivElement | null>(null);
      const publishDialogRef = useRef<IPublishDialogRef>(null);

      useEffect(() => {
        setCalendarRef(calendarRef.current!);
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

      // 监听 URL 参数，自动打开发布弹窗
      useEffect(() => {
        const openPublish = searchParams.get('openPublish');
        const fromSignIn = searchParams.get('fromSignIn');
        
        if (openPublish === 'true' && fromSignIn === 'true') {
          setPublishDialogOpen(true);
          // 清除 URL 参数，避免刷新页面时重复打开
          const url = new URL(window.location.href);
          url.searchParams.delete('openPublish');
          url.searchParams.delete('fromSignIn');
          window.history.replaceState({}, '', url.toString());
        }
      }, [searchParams]);

      // 监听自定义事件，打开发布弹窗
      useEffect(() => {
        const handleOpenPublishDialog = (event: CustomEvent) => {
          if (event.detail?.fromSignIn) {
            setPublishDialogOpen(true);
          }
        };

        window.addEventListener('openPublishDialog', handleOpenPublishDialog as EventListener);
        
        return () => {
          window.removeEventListener('openPublishDialog', handleOpenPublishDialog as EventListener);
        };
      }, []);

      useEffect(() => {
        getPubRecord();
      }, [accountActive, getPubRecord]);

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
            defaultAccountId={accountActive?.id}
            ref={publishDialogRef}
            open={publishDialogOpen}
            onClose={() => setPublishDialogOpen(false)}
            onPubSuccess={() => {
              getPubRecord();
            }}
            accounts={accountList}
          />

          <div className="calendarTiming-header">
            <div className="calendarTiming-header-user">
              {!accountActive ? (
                <>
                  <AllPlatIcon />
                  <div className="calendarTiming-header-user-details">
                    <div className="calendarTiming-header-user-details-name">
                      {t("allPlatforms")}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AvatarPlat
                    account={accountActive!}
                    avatarWidth={50}
                    width={18}
                  />
                  <div className="calendarTiming-header-user-details">
                    <div className="calendarTiming-header-user-details-name">
                      {accountActive.nickname}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="calendarTiming-header-options">
              <Button
                size="large"
                icon={<PlusOutlined />}
                onClick={() => {
                  setPublishDialogOpen(true);
                }}
              >
                {t("newWork")}
              </Button>
            </div>
          </div>
          <div className="calendarTiming-toolbar">
            <div className="calendarTiming-toolbar-left">
              {activeMode === "calendar" && (
                <>
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
                </>
              )}
            </div>
            <div className="calendarTiming-toolbar-right">
              <Tabs
                activeKey={activeMode}
                onChange={(key) => setActiveMode(key as "calendar" | "list")}
                items={[
                  {
                    key: "calendar",
                    label: (
                      <span>
                        <CalendarOutlined />
                        {t("calendarMode")}
                      </span>
                    ),
                  },
                  {
                    key: "list",
                    label: (
                      <span>
                        <UnorderedListOutlined />
                        {t("listModeTab")}
                      </span>
                    ),
                  },
                ]}
                size="small"
                className={styles.modeTabs}
              />
            </div>
          </div>
          {activeMode === "calendar" ? (
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
                      const dateStr = getDays(arg.date).format("YYYY-MM-DD");
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
          ) : (
            <ListMode 
              onClickPub={(date) => {
                publishDialogRef.current!.setPubTime(date);
                setPublishDialogOpen(true);
              }}
            />
          )}
        </div>
      );
    },
  ),
);

export default CalendarTiming;
