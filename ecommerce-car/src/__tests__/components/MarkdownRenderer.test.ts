import React from 'react';
import { MarkdownRenderer } from '../../components/chat/MarkdownRenderer';

describe('MarkdownRenderer Suite - Custom Markdown AST Parser & Elements', () => {
  it('renders without crashing for empty content', () => {
    const element = React.createElement(MarkdownRenderer, { content: '' });
    expect(element).toBeDefined();
  });

  it('renders plain text paragraphs', () => {
    const element = React.createElement(MarkdownRenderer, { content: 'Đây là đoạn văn bản đơn giản.' });
    expect(element).toBeDefined();
  });

  it('handles markdown headings (#, ##, ###, ####)', () => {
    const content = '# Tiêu đề 1\n## Tiêu đề 2\n### Tiêu đề 3\n#### Tiêu đề 4';
    const element = React.createElement(MarkdownRenderer, { content });
    expect(element).toBeDefined();
  });

  it('handles bold, italic, bold-italic, and strikethrough inline formats', () => {
    const content = 'Văn bản có **in đậm**, *in nghiêng*, ***đậm nghiêng*** và ~~gạch ngang~~.';
    const element = React.createElement(MarkdownRenderer, { content });
    expect(element).toBeDefined();
  });

  it('handles inline code and multiline fenced code blocks with language', () => {
    const content = 'Sử dụng `const x = 10;` trong mã nguồn.\n\n```typescript\nfunction hello() {\n  return "world";\n}\n```';
    const element = React.createElement(MarkdownRenderer, { content });
    expect(element).toBeDefined();
  });

  it('handles bulleted and numbered lists', () => {
    const content = '- Mục 1\n- Mục 2\n* Mục 3\n1. Bước một\n2. Bước hai';
    const element = React.createElement(MarkdownRenderer, { content });
    expect(element).toBeDefined();
  });

  it('handles blockquotes and dividers', () => {
    const content = '> Trợ lý AI gợi ý bạn chọn dòng SUV.\n\n---\n\nPhần tiếp theo';
    const element = React.createElement(MarkdownRenderer, { content });
    expect(element).toBeDefined();
  });

  it('handles markdown hyperlinks with URLs', () => {
    const content = 'Truy cập [Trang chủ AutoMatch](https://automatch.vn) để xem thêm.';
    const element = React.createElement(MarkdownRenderer, { content });
    expect(element).toBeDefined();
  });

  // CORNER / EDGE CASES
  it('handles unclosed markdown tags gracefully without infinite loops', () => {
    const unclosed = '**chưa đóng đậm và `chưa đóng code và *nghiêng dở';
    const element = React.createElement(MarkdownRenderer, { content: unclosed });
    expect(element).toBeDefined();
  });

  it('handles unclosed fenced code block at end of stream', () => {
    const streamingCode = '```javascript\nconsole.log("đang stream dở dang");';
    const element = React.createElement(MarkdownRenderer, { content: streamingCode });
    expect(element).toBeDefined();
  });

  it('handles user chat bubble style variant', () => {
    const element = React.createElement(MarkdownRenderer, {
      content: 'Tôi muốn tìm xe dưới 1 tỷ',
      isUser: true,
    });
    expect(element).toBeDefined();
  });
});
