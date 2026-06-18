import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import type { BeautifulMentionsCssClassNames } from 'lexical-beautiful-mentions'
import { createBeautifulMentionNode, PlaceholderNode } from 'lexical-beautiful-mentions'
import { cn } from '@/utils/className'
import { MediaMentionChip } from '../components/MediaMentionChip'
import styles from '../MediaMentionPromptInput.module.scss'

const mediaMentionTheme: BeautifulMentionsCssClassNames = {
  container: styles.mentionChip,
  containerFocused: cn(styles.mentionChip, styles.mentionChipFocused),
  trigger: styles.mentionTrigger,
  value: styles.mentionValue,
}

const mediaMentionNodes = [...createBeautifulMentionNode(MediaMentionChip), PlaceholderNode]

function createEditorConfig(nodes: InitialConfigType['nodes']): InitialConfigType {
  return {
    namespace: 'DraftBoxMediaMentionPromptEditor',
    nodes,
    onError(error: Error) {
      throw error
    },
    theme: {
      beautifulMentions: {
        '@': mediaMentionTheme,
      },
    },
  }
}

export const editorConfig = createEditorConfig(mediaMentionNodes)
