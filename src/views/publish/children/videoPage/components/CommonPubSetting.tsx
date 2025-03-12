import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useMemo,
  useState,
} from 'react';
import VideoCoverSeting from '@/views/publish/children/videoPage/components/VideoCoverSeting';
import { Input, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useVideoPageStore } from '@/views/publish/children/videoPage/useVideoPageStore';
import { useShallow } from 'zustand/react/shallow';
import { IImgFile } from '@/components/Choose/ImgChoose';
import { ScheduledTimeSelect } from './VideoPubSetModal/components/VideoPubSetModalCommon';
import {
  AccountPlatInfoMap,
  IAccountPlatInfo,
} from '../../../../account/comment';
import { AccountType } from '../../../../../../commont/AccountEnum';

const { TextArea } = Input;

export interface ICommonPubSettingRef {}

export interface ICommonPubSettingProps {}

// 通用参数设置组件
const CommonPubSetting = memo(
  forwardRef(
    ({}: ICommonPubSettingProps, ref: ForwardedRef<ICommonPubSettingRef>) => {
      const { setPubParams, videoListChoose, setVideoCoverFirst } =
        useVideoPageStore(
          useShallow((state) => ({
            setPubParams: state.setPubParams,
            videoListChoose: state.videoListChoose,
            setVideoCoverFirst: state.setVideoCoverFirst,
          })),
        );
      // 当前选择的通用封面
      const [cover, setCover] = useState<IImgFile>();

      // 获取选择的账户的所有相关平台
      const getChoosedAccountPlatList = useMemo(() => {
        const platMap = new Map<AccountType, IAccountPlatInfo>();
        videoListChoose.map((v) => {
          if (v.account) {
            platMap.set(
              v.account.type,
              AccountPlatInfoMap.get(v.account.type)!,
            );
          }
        });
        return Array.from(platMap.values());
      }, [videoListChoose]);

      // 所有平台通用发布参数的最大值获取，做为默认值
      const getPlatCommonParamsMax = useMemo(() => {
        const platList = Array.from(AccountPlatInfoMap.values());

        const maxValue = (getValue: (v: any) => number) =>
          Math.max(...platList.map((v) => getValue(v) || -Infinity));

        return {
          maxDate: maxValue((v) => v.commonPubParamsConfig.timingMax?.maxDate),
          timeOffset: maxValue(
            (v) => v.commonPubParamsConfig.timingMax?.timeOffset,
          ),
          titleMax: maxValue((v) => v.commonPubParamsConfig.titleMax),
        };
      }, [AccountPlatInfoMap]);

      return (
        <div className="commonPubSetting">
          <h1>通用发布设置</h1>
          <p className="commonPubSetting-tip">
            通用设置中的参数将会应用于所有账号
          </p>
          <h2>通用封面</h2>
          <VideoCoverSeting
            videoFile={videoListChoose.find((v) => v.video)?.video}
            value={cover}
            saveImgId="common"
            onClose={() => {
              setCover(undefined);
              setPubParams({
                cover: undefined,
              });
              setVideoCoverFirst(true);
            }}
            onChoosed={(imgFile) => {
              setCover(imgFile);
              setPubParams({
                cover: imgFile,
              });
            }}
          />
          <p className="commonPubSetting-tip">
            支持常用图片格式上传，暂不支持 GIF，上传后图片将按平台要求自动裁剪
          </p>
          <p className="commonPubSetting-tip">
            未上传任何图片的情况下，默认选择视频第一帧。
          </p>

          <h2>
            标题
            <Tooltip
              title={
                <div>
                  {Array.from(AccountPlatInfoMap.values()).map((platInfo) => {
                    const titleMax = platInfo.commonPubParamsConfig.titleMax;
                    return (
                      <p key={platInfo.name}>
                        <b>{platInfo.name}</b>
                        {!titleMax
                          ? `没有标题参数`
                          : `标题字数限制${titleMax}字`}
                      </p>
                    );
                  })}
                </div>
              }
            >
              <ExclamationCircleOutlined />
            </Tooltip>
          </h2>
          <Input
            showCount
            maxLength={Math.min(
              getPlatCommonParamsMax.titleMax,
              ...getChoosedAccountPlatList.map(
                (v) => v.commonPubParamsConfig.titleMax || 30,
              ),
            )}
            placeholder="请输入视频标题"
            variant="filled"
            onChange={(e) => {
              setPubParams({
                title: e.target.value,
              });
            }}
          />

          <h2>描述</h2>
          <TextArea
            placeholder="请输入视频描述"
            variant="filled"
            showCount
            maxLength={500}
            style={{ height: 200, resize: 'none' }}
            onChange={(e) => {
              setPubParams({
                describe: e.target.value,
              });
            }}
          />
          <p className="commonPubSetting-tip">
            描述中可带话题，以‘#’开头、‘空格’结尾，
            <Tooltip title="更多详情中单独设置的话题和描述中带的话题都是有效的，发布时将合并去重处理">
              <span style={{ color: 'rgb(250, 173, 20)' }}>
                <ExclamationCircleOutlined style={{ marginRight: '3px' }} />
                发布时
              </span>
            </Tooltip>
            将根据平台自动处理 如：这是一段文字描述#最美中国 #夏日穿搭
          </p>

          <h2>
            定时发布
            <Tooltip
              styles={{
                root: {
                  maxWidth: 'none',
                },
              }}
              title={
                <div>
                  {Array.from(AccountPlatInfoMap.values()).map((platInfo) => {
                    const timingMax = platInfo.commonPubParamsConfig.timingMax;
                    return (
                      <p key={platInfo.name}>
                        <b>{platInfo.name}</b>
                        {!timingMax
                          ? `没有定时发布参数；`
                          : `支持${timingMax.timeOffset}分钟后及${timingMax.maxDate}天内的定时发布；`}
                      </p>
                    );
                  })}
                </div>
              }
            >
              <ExclamationCircleOutlined />
            </Tooltip>
          </h2>
          <ScheduledTimeSelect
            maxDate={Math.min(
              getPlatCommonParamsMax.maxDate,
              ...getChoosedAccountPlatList.map(
                (v) => v.commonPubParamsConfig.timingMax?.maxDate || Infinity,
              ),
            )}
            timeOffset={Math.min(
              getPlatCommonParamsMax.timeOffset,
              ...getChoosedAccountPlatList.map(
                (v) =>
                  v.commonPubParamsConfig.timingMax?.timeOffset || Infinity,
              ),
            )}
            onChange={(e) => {
              setPubParams({
                timingTime: e ? e.toDate() : undefined,
              });
            }}
          />
        </div>
      );
    },
  ),
);
CommonPubSetting.displayName = 'CommonPubSetting';

export default CommonPubSetting;
