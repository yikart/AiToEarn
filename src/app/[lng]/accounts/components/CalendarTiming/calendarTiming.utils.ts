import styles from "./calendarTiming.module.scss";

// 日历国际化
export const getFullCalendarLang = (lang: string) => {
  switch (lang) {
    case "zh-CN":
      return "zh-cn";
    case "en":
      return "en-gb";
  }
  return "en-gb";
};

// 封装classNames切换方法
export function getTransitionClassNames(direction: "left" | "right" | "fade") {
  if (direction === "left") {
    return {
      enter: styles.slideLeftEnter,
      enterActive: styles.slideLeftEnterActive,
      exit: styles.slideLeftExit,
      exitActive: styles.slideLeftExitActive,
    };
  } else if (direction === "right") {
    return {
      enter: styles.slideRightEnter,
      enterActive: styles.slideRightEnterActive,
      exit: styles.slideRightExit,
      exitActive: styles.slideRightExitActive,
    };
  } else {
    // fade 动画
    return {
      enter: styles.fadeEnter,
      enterActive: styles.fadeEnterActive,
      exit: styles.fadeExit,
      exitActive: styles.fadeExitActive,
    };
  }
}
