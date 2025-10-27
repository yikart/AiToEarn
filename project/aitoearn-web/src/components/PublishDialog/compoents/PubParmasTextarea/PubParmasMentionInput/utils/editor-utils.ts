import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef } from "react";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { BeautifulMentionNode } from "lexical-beautiful-mentions";

export function InitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const lastAppliedRef = useRef<string>("");

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      const currentText = root.getTextContent();
      if (value === currentText || value === lastAppliedRef.current) return;

      root.clear();
      const paragraph = $createParagraphNode();
      root.append(paragraph);

      if (!value) {
        lastAppliedRef.current = value;
        return;
      }

      // 按原顺序拆分：话题片段形如 "#xxx"
      const parts = value.split(/(#\S+)/g).filter(Boolean);

      parts.forEach((part) => {
        if (part.startsWith("#")) {
          const topic = part.slice(1);
          if (topic) {
            // @ts-ignore 构造函数依库版本
            const mentionNode = new BeautifulMentionNode("#", topic);
            paragraph.append(mentionNode);
          }
        } else {
          if (part) {
            paragraph.append($createTextNode(part));
          }
        }
      });

      lastAppliedRef.current = value;
    });
  }, [editor, value]);

  return null;
}
