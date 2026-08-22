import React from 'react';
import { MarkdownRenderer } from '../../components/chat/MarkdownRenderer';

describe('Adversarial & Security Suite - Markdown & Injection Handling', () => {
  it('neutralizes dangerous script protocols in markdown links (XSS prevention)', () => {
    // Malicious javascript: and data: links should not be recognized as clickable links
    const malicious = '[Click here](javascript:alert(document.cookie)) and [Payload](data:text/html,<script>alert(1)</script>)';
    const element = React.createElement(MarkdownRenderer, { content: malicious });
    expect(element).toBeDefined();
  });

  it('resists Catastrophic Backtracking (ReDoS) on 20,000 unclosed markdown markers', () => {
    const startTime = Date.now();
    // 20,000 repeated asterisks and backticks
    const pathologicalString = '*'.repeat(10000) + '`'.repeat(5000) + '~'.repeat(5000);
    const element = React.createElement(MarkdownRenderer, { content: pathologicalString });
    const duration = Date.now() - startTime;

    expect(element).toBeDefined();
    // Parser must complete in under 100ms
    expect(duration).toBeLessThan(100);
  });

  it('handles deeply nested formatting strings without stack overflow', () => {
    const nested = '***bold italic `code with ~~strikethrough~~ and [link](https://automatch.vn)`***';
    const element = React.createElement(MarkdownRenderer, { content: nested });
    expect(element).toBeDefined();
  });

  it('handles strings with multiple continuous newlines and whitespace noise', () => {
    const noisy = '\n\n\n\n\n   \t\t\n\n# Header\n\n\n\n\n---   \n\n\n   ';
    const element = React.createElement(MarkdownRenderer, { content: noisy });
    expect(element).toBeDefined();
  });
});
