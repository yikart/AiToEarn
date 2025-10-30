import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './modal.css';

const ModalTemplate: React.FC<
  React.PropsWithChildren<{
    title?: ReactNode;
    footer?: ReactNode;
    cancelText?: string;
    okText?: string;
    onCancel?: () => void;
    onOk?: () => void;
    width?: number;
  }>
> = (props) => {
  const {
    title,
    children,
    footer,
    cancelText = 'Cancel',
    okText = 'OK',
    onCancel,
    onOk,
    width = 530,
  } = props;

  return (
    <div className="update-modal">
      <div className="update-modal__mask" />
      <div className="update-modal__warp">
        <div className="update-modal__content" style={{ width }}>
          <div className="content__header">
            <div className="content__header-text">{title}</div>
            <span className="update-modal--close" onClick={onCancel}>
              <svg
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M557.312 513.248l265.28-263.904c12.544-12.48 12.608-32.704 0.128-45.248-12.512-12.576-32.704-12.608-45.248-0.128l-265.344 263.936-263.04-263.84C236.64 191.584 216.384 191.52 203.84 204 191.328 216.48 191.296 236.736 203.776 249.28l262.976 263.776L201.6 776.8c-12.544 12.48-12.608 32.704-0.128 45.248 6.24 6.272 14.464 9.44 22.688 9.44 8.16 0 16.32-3.104 22.56-9.312l265.216-263.808 265.44 266.24c6.24 6.272 14.432 9.408 22.656 9.408 8.192 0 16.352-3.136 22.592-9.344 12.512-12.48 12.544-32.704 0.064-45.248L557.312 513.248z"
                  p-id="2764"
                  fill="currentColor"
                ></path>
              </svg>
            </span>
          </div>
          <div className="content__body">{children}</div>
          {typeof footer !== 'undefined' ? (
            <div className="content__footer">
              <button onClick={onCancel}>{cancelText}</button>
              <button onClick={onOk}>{okText}</button>
            </div>
          ) : (
            footer
          )}
        </div>
      </div>
    </div>
  );
};

const Modal = (
  props: Parameters<typeof ModalTemplate>[0] & { open: boolean },
) => {
  const { open, ...omit } = props;

  return createPortal(open ? ModalTemplate(omit) : null, document.body);
};

export default Modal;
