import { describe, it, expect } from 'vitest';
import { toHTML } from './html';

const basic = [
  { formattedHtml: '<em>Title</em>. Publisher.', formattedText: 'Title. Publisher.' },
];

describe('toHTML', () => {
  it('returns a complete HTML document', () => {
    const result = toHTML(basic);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="en">');
    expect(result).toContain('</html>');
  });

  it('uses "References" as default title', () => {
    const result = toHTML(basic);
    expect(result).toContain('<title>References</title>');
    expect(result).toContain('<h1>References</h1>');
  });

  it('uses the provided list name as title', () => {
    const result = toHTML(basic, 'My Bibliography');
    expect(result).toContain('<title>My Bibliography</title>');
    expect(result).toContain('<h1>My Bibliography</h1>');
  });

  it('wraps each citation in an <li>', () => {
    const citations = [
      { formattedHtml: 'First.', formattedText: 'First.' },
      { formattedHtml: 'Second.', formattedText: 'Second.' },
    ];
    const result = toHTML(citations);
    expect(result).toContain('<li>First.</li>');
    expect(result).toContain('<li>Second.</li>');
  });

  it('uses formattedHtml when available', () => {
    const result = toHTML([{ formattedHtml: '<em>Italic</em>', formattedText: 'Italic' }]);
    expect(result).toContain('<li><em>Italic</em></li>');
  });

  it('falls back to escaped formattedText when formattedHtml is empty', () => {
    const result = toHTML([{ formattedHtml: '', formattedText: 'A & B' }]);
    expect(result).toContain('<li>A &amp; B</li>');
  });

  it('escapes special characters in the list name', () => {
    const result = toHTML(basic, '<Script> & Co.');
    expect(result).toContain('&lt;Script&gt; &amp; Co.');
    expect(result).not.toContain('<Script>');
  });

  it('outputs an ordered list', () => {
    const result = toHTML(basic);
    expect(result).toContain('<ol>');
    expect(result).toContain('</ol>');
  });

  it('includes basic styles', () => {
    const result = toHTML(basic);
    expect(result).toContain('<style>');
    expect(result).toContain('font-family');
  });

  it('handles an empty citations array', () => {
    const result = toHTML([]);
    expect(result).toContain('<ol>');
    expect(result).toContain('</ol>');
    expect(result).not.toContain('<li>');
  });
});
