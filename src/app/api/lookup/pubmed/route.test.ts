import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

global.fetch = vi.fn();

const SAMPLE_XML = `<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <Article>
        <ArticleTitle>COVID-19 Vaccine Effectiveness</ArticleTitle>
        <AuthorList>
          <Author>
            <LastName>Smith</LastName>
            <ForeName>John A</ForeName>
          </Author>
          <Author>
            <CollectiveName>Study Group</CollectiveName>
          </Author>
        </AuthorList>
        <Journal>
          <Title>New England Journal of Medicine</Title>
          <ISOAbbreviation>N Engl J Med</ISOAbbreviation>
          <JournalIssue>
            <Volume>385</Volume>
            <Issue>12</Issue>
            <PubDate>
              <Year>2021</Year>
              <Month>Sep</Month>
              <Day>16</Day>
            </PubDate>
          </JournalIssue>
        </Journal>
        <Pagination><MedlinePgn>1081-1091</MedlinePgn></Pagination>
        <Abstract><AbstractText>Summary of the study.</AbstractText></Abstract>
      </Article>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="doi">10.1056/NEJMoa2108891</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`;

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/lookup/pubmed', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('PubMed Lookup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when pmid is missing', async () => {
    const response = await POST(makeRequest({}));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 for non-numeric PMID', async () => {
    const response = await POST(makeRequest({ pmid: 'abc' }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Invalid PMID/i);
  });

  it('returns 404 when PubMed returns <ERROR>', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => '<PubmedArticleSet><ERROR>ID not found</ERROR></PubmedArticleSet>',
    });
    const response = await POST(makeRequest({ pmid: '99999999' }));
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 502 when PubMed API fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const response = await POST(makeRequest({ pmid: '12345678' }));
    const data = await response.json();
    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
  });

  it('parses a valid PubMed response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_XML,
    });
    const response = await POST(makeRequest({ pmid: '34407382' }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('COVID-19 Vaccine Effectiveness');
    expect(data.data.authors).toHaveLength(2);
    expect(data.data.authors[0].lastName).toBe('Smith');
    expect(data.data.authors[0].firstName).toBe('John A');
    expect(data.data.authors[1].isOrganization).toBe(true);
    expect(data.data.journalTitle).toBe('New England Journal of Medicine');
    expect(data.data.volume).toBe('385');
    expect(data.data.issue).toBe('12');
    expect(data.data.pageRange).toBe('1081-1091');
    expect(data.data.publicationDate.year).toBe(2021);
    expect(data.data.publicationDate.month).toBe(9);
    expect(data.data.doi).toBe('10.1056/NEJMoa2108891');
  });

  describe('PMID format extraction', () => {
    const successMock = () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_XML,
      });
    };

    it('strips "PMID:" prefix', async () => {
      successMock();
      const response = await POST(makeRequest({ pmid: 'PMID: 34407382' }));
      expect(response.status).toBe(200);
    });

    it('extracts PMID from PubMed URL', async () => {
      successMock();
      const response = await POST(makeRequest({ pmid: 'https://pubmed.ncbi.nlm.nih.gov/34407382/' }));
      expect(response.status).toBe(200);
    });
  });

  describe('month parsing', () => {
    it('parses abbreviated month names', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_XML.replace('<Month>Sep</Month>', '<Month>Jan</Month>'),
      });
      const response = await POST(makeRequest({ pmid: '12345' }));
      const data = await response.json();
      expect(data.data.publicationDate.month).toBe(1);
    });

    it('parses numeric month', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_XML.replace('<Month>Sep</Month>', '<Month>7</Month>'),
      });
      const response = await POST(makeRequest({ pmid: '12345' }));
      const data = await response.json();
      expect(data.data.publicationDate.month).toBe(7);
    });
  });

  it('returns 504 on timeout', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      Object.assign(new Error('timeout'), { name: 'AbortError' })
    );
    const response = await POST(makeRequest({ pmid: '12345678' }));
    const data = await response.json();
    expect(response.status).toBe(504);
    expect(data.success).toBe(false);
  });
});
