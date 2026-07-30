import React from 'react';
import { View, type StyleProp, type TextStyle } from 'react-native';
import { Text } from './Text';
import { colors } from '../tokens/colors';
import type { TypographyVariant } from '../tokens/typography';

export interface MarkdownProps {
  children: string;
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
}

interface Span {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/** Split a line into styled spans: bold, italic and inline code. */
function parseInline(line: string): Span[] {
  const spans: Span[] = [];
  // Order matters: ** before * so bold wins over italic.
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) spans.push({ text: line.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**') || tok.startsWith('__')) {
      spans.push({ text: tok.slice(2, -2), bold: true });
    } else if (tok.startsWith('`')) {
      spans.push({ text: tok.slice(1, -1), code: true });
    } else {
      spans.push({ text: tok.slice(1, -1), italic: true });
    }
    last = m.index + tok.length;
  }
  if (last < line.length) spans.push({ text: line.slice(last) });
  return spans.length ? spans : [{ text: line }];
}

const BULLET = /^\s*([-*•])\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

/**
 * Minimal markdown renderer for LLM output — bold, italic, inline code, bullet
 * and numbered lists, and headings. Deliberately tiny: models emit `**text**`
 * constantly and showing raw asterisks looks broken, but a full markdown engine
 * is far more dependency than this needs.
 */
export function Markdown({
  children,
  variant = 'body',
  color = colors.ink,
  style,
}: MarkdownProps): React.ReactElement {
  const lines = (children ?? '').replace(/\r\n/g, '\n').split('\n');

  const renderSpans = (text: string): React.ReactNode =>
    parseInline(text).map((s, i) => (
      <Text
        key={i}
        variant={variant}
        color={color}
        style={[
          s.bold ? { fontWeight: '700' } : null,
          s.italic ? { fontStyle: 'italic' } : null,
          s.code
            ? { fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.06)', fontSize: 12.5 }
            : null,
          style,
        ]}
      >
        {s.text}
      </Text>
    ));

  return (
    <View>
      {lines.map((raw, i) => {
        if (!raw.trim()) return <View key={i} style={{ height: 6 }} />;

        const heading = HEADING.exec(raw);
        if (heading) {
          return (
            <Text
              key={i}
              variant="bodyStrong"
              color={color}
              style={[{ marginTop: i === 0 ? 0 : 6, marginBottom: 2 }, style]}
            >
              {heading[1]}
            </Text>
          );
        }

        const bullet = BULLET.exec(raw);
        const numbered = !bullet ? NUMBERED.exec(raw) : null;
        if (bullet || numbered) {
          const marker = bullet ? '•' : `${numbered![1]}.`;
          const body = (bullet ? bullet[2] : numbered![2]) ?? '';
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 7, marginTop: 3 }}>
              <Text variant={variant} color={color} style={style}>
                {marker}
              </Text>
              <Text variant={variant} color={color} style={[{ flex: 1 }, style]}>
                {renderSpans(body)}
              </Text>
            </View>
          );
        }

        return (
          <Text key={i} variant={variant} color={color} style={[{ marginTop: i === 0 ? 0 : 2 }, style]}>
            {renderSpans(raw)}
          </Text>
        );
      })}
    </View>
  );
}
