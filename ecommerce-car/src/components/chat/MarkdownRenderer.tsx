import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TextStyle,
  Platform,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
  style?: TextStyle;
}

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'bold_italic' | 'code' | 'link' | 'strikethrough';
  text: string;
  url?: string;
}

interface BlockToken {
  type: 'heading' | 'list_item' | 'code_block' | 'quote' | 'paragraph' | 'divider';
  level?: number;
  listType?: 'bullet' | 'ordered';
  listIndex?: number;
  language?: string;
  content: string;
}

// Parses inline text into tokens (bold, italic, inline code, link, etc.)
function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Regex matches:
  // 1. Links: [text](url)
  // 2. Bold+Italic: ***text*** or ___text___
  // 3. Bold: **text** or __text__
  // 4. Italic: *text* or _text_
  // 5. Code: `code`
  // 6. Strikethrough: ~~text~~
  const regex = /(\[.*?\]\(https?:\/\/[^\s)]+\))|(\*\*\*.*?\*\*\*)|(\*\*.*?\*\*)|(\*.*?\*)|(`[^`]+`)|(~~.*?~~)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];

    // Push preceding plain text
    if (matchIndex > lastIndex) {
      tokens.push({
        type: 'text',
        text: text.slice(lastIndex, matchIndex),
      });
    }

    if (matchStr.startsWith('[') && matchStr.includes('](')) {
      const closingBracket = matchStr.indexOf('](');
      const linkText = matchStr.slice(1, closingBracket);
      const url = matchStr.slice(closingBracket + 2, -1);
      tokens.push({ type: 'link', text: linkText, url });
    } else if (matchStr.startsWith('***') && matchStr.endsWith('***') && matchStr.length >= 6) {
      tokens.push({ type: 'bold_italic', text: matchStr.slice(3, -3) });
    } else if (matchStr.startsWith('**') && matchStr.endsWith('**') && matchStr.length >= 4) {
      tokens.push({ type: 'bold', text: matchStr.slice(2, -2) });
    } else if (matchStr.startsWith('*') && matchStr.endsWith('*') && matchStr.length >= 2) {
      tokens.push({ type: 'italic', text: matchStr.slice(1, -1) });
    } else if (matchStr.startsWith('`') && matchStr.endsWith('`') && matchStr.length >= 2) {
      tokens.push({ type: 'code', text: matchStr.slice(1, -1) });
    } else if (matchStr.startsWith('~~') && matchStr.endsWith('~~') && matchStr.length >= 4) {
      tokens.push({ type: 'strikethrough', text: matchStr.slice(2, -2) });
    } else {
      tokens.push({ type: 'text', text: matchStr });
    }

    lastIndex = matchIndex + matchStr.length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      text: text.slice(lastIndex),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', text }];
}

// Parses multiline markdown string into block tokens
function parseBlocks(markdown: string): BlockToken[] {
  const lines = markdown.split('\n');
  const blocks: BlockToken[] = [];

  let inCodeBlock = false;
  let codeBuffer = '';
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code_block',
          language: codeLang,
          content: codeBuffer.trimEnd(),
        });
        inCodeBlock = false;
        codeBuffer = '';
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeBuffer = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer += (codeBuffer ? '\n' : '') + rawLine;
      continue;
    }

    // Empty lines
    if (!trimmed) {
      continue;
    }

    // Dividers
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'divider', content: '' });
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'heading', level: 4, content: trimmed.slice(5) });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, content: trimmed.slice(4) });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, content: trimmed.slice(3) });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, content: trimmed.slice(2) });
      continue;
    }

    // Quotes
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', content: trimmed.slice(2) });
      continue;
    }

    // Bullet lists
    const bulletMatch = rawLine.match(/^(\s*)([-*+])\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'list_item',
        listType: 'bullet',
        content: bulletMatch[3],
      });
      continue;
    }

    // Ordered lists
    const orderedMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      blocks.push({
        type: 'list_item',
        listType: 'ordered',
        listIndex: parseInt(orderedMatch[2], 10),
        content: orderedMatch[3],
      });
      continue;
    }

    // Standard paragraph
    blocks.push({ type: 'paragraph', content: rawLine });
  }

  // Unclosed code block during active streaming
  if (inCodeBlock && codeBuffer) {
    blocks.push({
      type: 'code_block',
      language: codeLang,
      content: codeBuffer,
    });
  }

  return blocks;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(
  ({ content, isUser = false, style }) => {
    const blocks = useMemo(() => parseBlocks(content || ''), [content]);

    const handleOpenLink = (url?: string) => {
      if (url) {
        Linking.openURL(url).catch((err) => console.warn('[Markdown] Failed to open URL:', err));
      }
    };

    const renderInlineTokens = (text: string, baseStyle: TextStyle | (TextStyle | null | undefined)[]) => {
      const tokens = parseInline(text);
      return tokens.map((token, idx) => {
        switch (token.type) {
          case 'bold':
            return (
              <Text
                key={idx}
                style={[
                  baseStyle,
                  styles.bold,
                  isUser ? styles.userText : { color: colors.text },
                ]}
              >
                {token.text}
              </Text>
            );
          case 'italic':
            return (
              <Text key={idx} style={[baseStyle, styles.italic]}>
                {token.text}
              </Text>
            );
          case 'bold_italic':
            return (
              <Text key={idx} style={[baseStyle, styles.bold, styles.italic]}>
                {token.text}
              </Text>
            );
          case 'code':
            return (
              <Text
                key={idx}
                style={[
                  baseStyle,
                  styles.inlineCode,
                  isUser ? styles.inlineCodeUser : styles.inlineCodeAssistant,
                ]}
              >
                {token.text}
              </Text>
            );
          case 'strikethrough':
            return (
              <Text key={idx} style={[baseStyle, styles.strikethrough]}>
                {token.text}
              </Text>
            );
          case 'link':
            return (
              <Text
                key={idx}
                style={[baseStyle, styles.link]}
                onPress={() => handleOpenLink(token.url)}
              >
                {token.text}
              </Text>
            );
          default:
            return (
              <Text key={idx} style={baseStyle}>
                {token.text}
              </Text>
            );
        }
      });
    };

    const textColor = isUser ? '#FFFFFF' : colors.text;
    const baseTextStyle: TextStyle = {
      color: textColor,
      fontSize: typography.sizes.xs + 1,
      lineHeight: 20,
      ...style,
    };

    return (
      <View style={styles.container}>
        {blocks.map((block, index) => {
          const isLast = index === blocks.length - 1;

          switch (block.type) {
            case 'heading': {
              const headingStyle: TextStyle =
                block.level === 1
                  ? styles.h1
                  : block.level === 2
                  ? styles.h2
                  : block.level === 3
                  ? styles.h3
                  : styles.h4;

              return (
                <View key={index} style={[styles.blockSpacing, isLast && styles.noBottomMargin]}>
                  <Text style={[baseTextStyle, headingStyle, isUser ? styles.userText : null]}>
                    {renderInlineTokens(block.content, [baseTextStyle, headingStyle])}
                  </Text>
                </View>
              );
            }

            case 'list_item': {
              return (
                <View
                  key={index}
                  style={[styles.listItemRow, isLast && styles.noBottomMargin]}
                >
                  <View style={styles.listBulletContainer}>
                    {block.listType === 'bullet' ? (
                      <View
                        style={[
                          styles.bulletDot,
                          isUser ? styles.bulletDotUser : styles.bulletDotAssistant,
                        ]}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.listIndexText,
                          isUser ? styles.userText : { color: colors.primaryHover },
                        ]}
                      >
                        {block.listIndex}.
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.listContentText, baseTextStyle]}>
                    {renderInlineTokens(block.content, baseTextStyle)}
                  </Text>
                </View>
              );
            }

            case 'code_block': {
              return (
                <View
                  key={index}
                  style={[
                    styles.codeBlockContainer,
                    isLast && styles.noBottomMargin,
                  ]}
                >
                  {Boolean(block.language) && (
                    <View style={styles.codeBlockHeader}>
                      <Text style={styles.codeBlockLang}>{block.language}</Text>
                    </View>
                  )}
                  <Text style={styles.codeBlockText}>{block.content}</Text>
                </View>
              );
            }

            case 'quote': {
              return (
                <View
                  key={index}
                  style={[
                    styles.quoteContainer,
                    isUser ? styles.quoteContainerUser : styles.quoteContainerAssistant,
                    isLast && styles.noBottomMargin,
                  ]}
                >
                  <Text style={[baseTextStyle, styles.quoteText]}>
                    {renderInlineTokens(block.content, baseTextStyle)}
                  </Text>
                </View>
              );
            }

            case 'divider': {
              return (
                <View
                  key={index}
                  style={[
                    styles.divider,
                    isUser ? styles.dividerUser : styles.dividerAssistant,
                    isLast && styles.noBottomMargin,
                  ]}
                />
              );
            }

            case 'paragraph':
            default: {
              return (
                <View key={index} style={[styles.paragraphSpacing, isLast && styles.noBottomMargin]}>
                  <Text style={baseTextStyle}>
                    {renderInlineTokens(block.content, baseTextStyle)}
                  </Text>
                </View>
              );
            }
          }
        })}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  blockSpacing: {
    marginBottom: 6,
  },
  paragraphSpacing: {
    marginBottom: 4,
  },
  noBottomMargin: {
    marginBottom: 0,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  userText: {
    color: '#FFFFFF',
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: typography.sizes.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  inlineCodeAssistant: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: colors.primaryHover,
  },
  inlineCodeUser: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: '#FFFFFF',
  },
  link: {
    color: colors.primaryHover,
    textDecorationLine: 'underline',
    fontWeight: typography.weights.semibold,
  },
  h1: {
    fontSize: typography.sizes.sm + 2,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  h2: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: '700',
    color: '#F3F4F6',
    marginTop: 4,
    marginBottom: 2,
  },
  h3: {
    fontSize: typography.sizes.xs + 2,
    fontWeight: '700',
    color: '#E5E7EB',
    marginTop: 2,
    marginBottom: 2,
  },
  h4: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
    paddingLeft: 2,
  },
  listBulletContainer: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 7,
    marginRight: 4,
  },
  bulletDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
  },
  bulletDotAssistant: {
    backgroundColor: colors.primaryHover,
  },
  bulletDotUser: {
    backgroundColor: '#FFFFFF',
  },
  listIndexText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    lineHeight: 18,
  },
  listContentText: {
    flex: 1,
  },
  codeBlockContainer: {
    backgroundColor: '#111827',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.sm,
    marginVertical: 4,
  },
  codeBlockHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 4,
    marginBottom: 4,
  },
  codeBlockLang: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#E5E7EB',
    lineHeight: 16,
  },
  quoteContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 2,
    marginVertical: 4,
  },
  quoteContainerAssistant: {
    borderLeftColor: colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  quoteContainerUser: {
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  quoteText: {
    fontStyle: 'italic',
    opacity: 0.9,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  dividerAssistant: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
