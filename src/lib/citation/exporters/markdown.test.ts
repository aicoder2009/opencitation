import { describe, it, expect } from 'vitest';
import { toMarkdown } from './markdown';

const basic = [
  { formattedHtml: '<em>Title</em>. Publisher.', formattedText: 'Title. Publisher.' },
];

describe('toMarkdown', () => {
  it('starts with a level-1 heading', () => {
    const result = toMarkdown(basic);
    expect(result.startsWith('# References\n')).toBe(true);
  });

  it('uses list name in heading when provided', () => {
    const result = toMarkdown(basic, 'My Sources');
    expect(result.startsWith('# My Sources — References\n')).toBe(true);
  });

  it('numbers each citation starting at 1', () => {
    const citations = [
      { formattedHtml: 'First.', formattedText: 'First.' },
      { formattedHtml: 'Second.', formattedText: 'Second.' },
    ];
    const result = toMarkdown(citations);
    expect(result).toContain('1. First.');
    expect(result).toContain('2. Second.');
  });

  it('converts <em> tags to markdown italics', () => {
    const result = toMarkdown([{ formattedHtml: '<em>Italic Title</em>.', formattedText: '' }]);
    expect(result).toContain('*Italic Title*.');
  });

  it('converts <strong> tags to markdown bold', () => {
    const result = toMarkdown([{ formattedHtml: '<strong>Bold</strong>', formattedText: '' }]);
    expect(result).toContain('**Bold**');
  });

  it('strips remaining HTML tags', () => {
    const result = toMarkdown([
      { formattedHtml: '<a href="x">Link text</a>.', formattedText: '' },
    ]);
    expect(result).not.toContain('<a');
    expect(result).toContain('Link text.');
  });

  it('decodes HTML entities', () => {
    const result = toMarkdown([
      { formattedHtml: 'Smith &amp; Jones.', formattedText: '' },
    ]);
    expect(result).toContain('Smith & Jones.');
  });

  it('decodes &lt; &gt; &quot; &#39; &nbsp;', () => {
    const result = toMarkdown([
      { formattedHtml: '&lt;tag&gt; &quot;quoted&quot; it&#39;s&nbsp;here', formattedText: '' },
    ]);
    expect(result).toContain('<tag>');
    expect(result).toContain('"quoted"');
    expect(result).toContain("it's");
    expect(result).toContain('here');
  });

  it('ends with a newline', () => {
    const result = toMarkdown(basic);
    expect(result.endsWith('\n')).toBe(true);
  });

  it('handles an empty list', () => {
    const result = toMarkdown([]);
    expect(result).toContain('# References');
    expect(result).not.toMatch(/^\d+\./m);
  });

  it('falls back to formattedText when formattedHtml is empty', () => {
    const result = toMarkdown([{ formattedHtml: '', formattedText: 'Plain text.' }]);
    expect(result).toContain('1. Plain text.');
  });
});
