import { ForwardedRef, forwardRef, memo, useRef, useState } from "react";
import styles from "../../image.module.scss";
import { Steps } from "antd";
import { useShallow } from "zustand/react/shallow";
import { useImagePageStore } from "../../useImagePageStore";
import ImageParamsSet from "./components/ImageParamsSet";
import ChooseAccountModule, {
  IChooseAccountModuleRef,
} from "@/app/[lng]/publish/components/ChooseAccountModule/ChooseAccountModule";
import { ChooseAccountChunk } from "@/app/[lng]/publish/components/CommonComponents/CommonComponents";
import SupportPlat from "@/app/[lng]/publish/components/SupportPlat/SupportPlat";
import { PubType } from "@/app/config/publishConfig";

export interface IImageRightSettingRef {}

export interface IImageRightSettingProps {}

const ImageRightSetting = memo(
  forwardRef(
    ({}: IImageRightSettingProps, ref: ForwardedRef<IImageRightSettingRef>) => {
      const [chooseAccountOpen, setChooseAccountOpen] = useState(false);
      const { imageAccounts, addAccount, activePlat } = useImagePageStore(
        useShallow((state) => ({
          imageAccounts: state.imageAccounts,
          addAccount: state.addAccount,
          activePlat: state.activePlat,
        })),
      );
      const chooseAccountModuleRef = useRef<IChooseAccountModuleRef>(null);

      return (
        <>
          <ChooseAccountModule
            ref={chooseAccountModuleRef}
            open={chooseAccountOpen}
            onClose={setChooseAccountOpen}
            platChooseProps={{
              choosedAccounts: imageAccounts
                .map((v) => v.account)
                .filter((v) => v !== undefined),
              pubType: PubType.ImageText,
              defaultPlat: activePlat,
            }}
            onPlatConfirm={(aList) => {
              addAccount(aList);
            }}
          />
          {imageAccounts.length === 0 ? (
            <div className={styles.imageRightSetting}>
              <SupportPlat
                pubType={PubType.ImageText}
                style={{ marginTop: "15px" }}
              />

              <h2 className="imageRightSetting-title">发布账户</h2>
              <ChooseAccountChunk
                onClick={() => {
                  setChooseAccountOpen(true);
                }}
              />

              <Steps
                direction="vertical"
                size="small"
                items={[
                  {
                    title: "选择发布账号",
                    description: "选择将要推文的账号",
                  },
                  {
                    title: "调整发文规则",
                    description:
                      "完成账号选择后，撰写推文，按需调整各个平台发文规则",
                  },
                ]}
              />
            </div>
          ) : (
            <ImageParamsSet
              openChooseAccount={() => {
                setChooseAccountOpen(true);
                chooseAccountModuleRef
                  .current!.getPlatChooseRef()
                  ?.setActivePlat(activePlat!);
              }}
            />
          )}
        </>
      );
    },
  ),
);
ImageRightSetting.displayName = "ImageRightSetting";

export default ImageRightSetting;
