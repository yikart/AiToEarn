import { ForwardedRef, forwardRef, memo, useEffect, useState } from 'react';
import styles from './imgTextImagesView.module.scss';
import { Button } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useImagePageStore } from '../../useImagePageStore';
import { useShallow } from 'zustand/react/shallow';
import { ReactSortable } from 'react-sortablejs';
import ImgChoose from '../../../../../../components/Choose/ImgChoose';

export interface IImgTextImagesViewRef {}

export interface IImgTextImagesViewProps {}

const ImgTextImagesView = memo(
  forwardRef(
    ({}: IImgTextImagesViewProps, ref: ForwardedRef<IImgTextImagesViewRef>) => {
      const { images, setImages, addImages, imgUploadLimit } =
        useImagePageStore(
          useShallow((state) => ({
            images: state.images,
            setImages: state.setImages,
            addImages: state.addImages,
            imgUploadLimit: state.imgUploadLimit,
          })),
        );
      const [srcollEl, setSrcollEl] = useState<HTMLElement>();

      useEffect(() => {
        const el = document.getElementById('imgTextImagesView-wrapper');
        setSrcollEl(el!);
      }, []);

      return (
        <div className={styles.imgTextImagesView}>
          <div className="imgTextImagesView_head">
            <div className="imgTextImagesView_head-left">
              图片编辑（{images.length}/{imgUploadLimit}）
            </div>
            <div className="imgTextImagesView_head-right">
              <div className="imgTextImagesView_head-right-tips">
                长按拖动排序
              </div>
              <ImgChoose
                onMultipleChoose={(imgFiles) => {
                  if (imgFiles.length !== 0) {
                    addImages(imgFiles);
                  }
                }}
              >
                <Button type="link" icon={<PlusOutlined />}>
                  本地上传
                </Button>
              </ImgChoose>
            </div>
          </div>

          <div id="imgTextImagesView-wrapper">
            {srcollEl && (
              <ReactSortable
                className="imgTextImagesView_content"
                list={images}
                animation={250}
                setList={setImages}
                scrollSensitivity={100}
                scroll={srcollEl}
                scrollSpeed={15}
              >
                {images.map((v, i) => {
                  return (
                    <div className="imgTextImagesView_content-item" key={v.id}>
                      <img src={v.imgUrl} alt={v.filename} />
                      <div
                        className="imgTextImagesView_content-item-close"
                        onClick={() => {
                          console.log(i);
                          const newImages = [...images];
                          newImages.splice(i, 1);
                          setImages(newImages);
                        }}
                      >
                        <CloseOutlined />
                      </div>
                    </div>
                  );
                })}
              </ReactSortable>
            )}
          </div>
        </div>
      );
    },
  ),
);
ImgTextImagesView.displayName = 'ImgTextImagesView';

export default ImgTextImagesView;
