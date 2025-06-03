import { ForwardedRef, forwardRef, memo, useEffect, useMemo } from "react";
import { useImagePageStore } from "../../../useImagePageStore";
import { useShallow } from "zustand/react/shallow";
import styles from "./imageParamsSet.module.scss";
import { IImageAccountItem } from "../../../imagePage.type";
import { CloseOutlined, InfoOutlined } from "@ant-design/icons";
import ParamsSettingDetails from "./ParamsSettingDetails";
import { Tooltip } from "antd";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { ErrPubParamsItem } from "@/app/[lng]/publish/hooks/usePubParamsVerify";

export interface IImageParamsSetRef {}

export interface IImageParamsSetProps {
  openChooseAccount: () => void;
}

// 图片发布右侧参数设置
const ImageParamsSet = memo(
  forwardRef(
    (
      { openChooseAccount }: IImageParamsSetProps,
      ref: ForwardedRef<IImageParamsSetRef>,
    ) => {
      const {
        imageAccounts,
        activePlat,
        setActivePlat,
        setPlatActiveAccountMap,
        platActiveAccountMap,
        delAccountByPalt,
        errParamsMap,
      } = useImagePageStore(
        useShallow((state) => ({
          imageAccounts: state.imageAccounts,
          setActivePlat: state.setActivePlat,
          activePlat: state.activePlat,
          setPlatActiveAccountMap: state.setPlatActiveAccountMap,
          platActiveAccountMap: state.platActiveAccountMap,
          delAccountByPalt: state.delAccountByPalt,
          errParamsMap: state.errParamsMap,
        })),
      );

      const platAccountImagesMap = useMemo(() => {
        // 平台账户map
        const platAccountMap = new Map<PlatType, IImageAccountItem[]>([]);

        for (const imageAccount of imageAccounts) {
          if (!platAccountMap.has(imageAccount.account.type)) {
            platAccountMap.set(imageAccount.account.type, []);
          }
          platAccountMap.get(imageAccount.account.type)?.push(imageAccount);
        }
        return platAccountMap;
      }, [imageAccounts]);

      useEffect(() => {
        // 当前选择的平台不存在了便重新选择
        if (!activePlat || !platAccountImagesMap.has(activePlat)) {
          setActivePlat(Array.from(platAccountImagesMap)[0][0]);
        }

        // 默认选中的平台map
        const newPlatActiveAccountMap = new Map<PlatType, IImageAccountItem>();

        for (const [accountType, imageAccountItems] of platAccountImagesMap) {
          if (!newPlatActiveAccountMap.has(accountType)) {
            newPlatActiveAccountMap.set(accountType, imageAccountItems[0]);
          }
        }

        // 将旧的选中的平台账户设置为新的
        for (const [accountType, imageAccountItem] of newPlatActiveAccountMap) {
          // 旧的选中账户
          const activeImageAccountItem = platActiveAccountMap.get(accountType);
          if (
            !activeImageAccountItem ||
            activeImageAccountItem.account.id === imageAccountItem.account.id
          )
            continue;

          // 旧的选中账户新的账户列表是否存在，如果存在则使用上一次选中的状态
          if (
            platAccountImagesMap
              .get(accountType)!
              .some((v) => v.account.id === activeImageAccountItem.account.id)
          ) {
            newPlatActiveAccountMap.set(
              accountType,
              platActiveAccountMap.get(accountType)!,
            );
            break;
          }
        }

        // 设置store当前选择的平台账户
        setPlatActiveAccountMap(newPlatActiveAccountMap);
      }, [platAccountImagesMap]);

      // key=平台，val==错误消息
      const errParamsPlatMap = useMemo(() => {
        if (!errParamsMap) return undefined;
        const errParamsMapTemp = new Map<PlatType, ErrPubParamsItem>();
        for (const [_, errParamsItem] of errParamsMap) {
          if (!errParamsMapTemp.has(errParamsItem.plat!)) {
            errParamsMapTemp.set(errParamsItem.plat!, errParamsItem);
          }
        }
        return errParamsMapTemp;
      }, [errParamsMap]);

      return (
        <div className={styles.imageParamsSet}>
          <div className="imageParamsSet_plats">
            {Array.from(platAccountImagesMap).map(([accountType]) => {
              const platInfo = AccountPlatInfoMap.get(accountType)!;
              return (
                <div
                  className={[
                    "imageParamsSet_plats-item",
                    accountType === activePlat &&
                      "imageParamsSet_plats-item--active",
                  ].join(" ")}
                  key={accountType}
                  onClick={() => {
                    setActivePlat(accountType);
                  }}
                >
                  <div className="imageParamsSet_plats-item-img">
                    <img src={platInfo.icon} />
                    <div
                      className={`${styles.closeIcon} imageParamsSet_plats-item-close`}
                      onClick={(e) => {
                        e.stopPropagation();
                        delAccountByPalt(accountType);
                      }}
                    >
                      <CloseOutlined />
                    </div>
                    {errParamsPlatMap?.get(accountType) && (
                      <Tooltip
                        title={errParamsPlatMap?.get(accountType)?.parErrMsg}
                      >
                        <div className="imageParamsSet_plats-item-err">
                          <InfoOutlined />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                  <span>{platInfo.name}</span>
                </div>
              );
            })}
          </div>
          {activePlat && platAccountImagesMap.get(activePlat) && (
            <ParamsSettingDetails
              openChooseAccount={openChooseAccount}
              imageAccountList={platAccountImagesMap.get(activePlat)!}
            />
          )}
        </div>
      );
    },
  ),
);
ImageParamsSet.displayName = "ImageParamsSet";

export default ImageParamsSet;
