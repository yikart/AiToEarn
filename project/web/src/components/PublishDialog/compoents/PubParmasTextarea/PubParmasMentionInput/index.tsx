"use client";

import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useRef,
} from "react";
import {
  BeautifulMentionNode,
  BeautifulMentionsPlugin,
  PlaceholderNode,
} from "lexical-beautiful-mentions";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState, $getRoot, LexicalEditor } from "lexical";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import styles from "./pubParmasMentionInput.module.scss";

import {
  Menu,
  MenuItem,
} from "@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasMentionInput/components/Menu";
import { getDouyinTopicsApi } from "@/api/dataStatistics";
import {
  InitialValuePlugin,
  PasteTopicsPlugin,
} from "@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasMentionInput/utils/editor-utils";

export interface IPubParmasMentionInputRef {}

export interface IPubParmasMentionInputProps {
  onChange: (value: string) => void;
  value: string;
  placeholder: string;
  maxLength: number;
}

const mentionItems = {
  "#": [],
};

const editorConfig: InitialConfigType = {
  nodes: [BeautifulMentionNode, PlaceholderNode],
  namespace: "PublishDescriptionEditor",
  onError(error: Error) {
    throw error;
  },
  theme: {
    beautifulMentions: {
      "#": `${styles.mentionsStyle}`,
    },
  },
};

const PubParmasMentionInput = memo(
  forwardRef(
    (
      { onChange, value, placeholder, maxLength }: IPubParmasMentionInputProps,
      ref: ForwardedRef<IPubParmasMentionInputRef>,
    ) => {
      const comboboxAnchor = useRef<HTMLDivElement>(null);
      const handleChange = useCallback(
        (editorState: EditorState, editor: LexicalEditor) => {
          editorState.read(() => {
            const root = $getRoot();
            const text = root.getTextContent();
            onChange(text);
          });
        },
        [],
      );

      const handleSearch = useCallback(
        async (trigger: string, queryString?: string | null) => {
          if (!queryString) return [];
          const res = await getDouyinTopicsApi(queryString!);
          return res?.data ?? [];
        },
        [],
      );

      // @ts-ignore
      const beautifulMentionsProps: any = {
        comboboxAnchor: comboboxAnchor.current,
        items: mentionItems,
        triggers: ["#"],
        autoSpace: true,
        creatable: {
          "#": 'Add tag "{{name}}"',
        },
        menuComponent: Menu,
        menuItemComponent: MenuItem,
        emptyComponent: undefined,
        insertOnBlur: true,
        allowSpaces: false,
        searchDelay: 200,
        onSearch: handleSearch,
      };

      return (
        <div className={styles.mentionsContainer} ref={comboboxAnchor}>
          <LexicalComposer initialConfig={editorConfig}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={styles.mentionsContentEditable}
                  style={{ tabSize: 1 }}
                />
              }
              placeholder={
                <div className={styles.mentionsPlaceholder}>{placeholder}</div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
            <AutoFocusPlugin defaultSelection="rootStart" />

            <InitialValuePlugin value={value} />

            <PasteTopicsPlugin />

            <BeautifulMentionsPlugin {...beautifulMentionsProps} />
          </LexicalComposer>
        </div>
      );
    },
  ),
);

export default PubParmasMentionInput;
