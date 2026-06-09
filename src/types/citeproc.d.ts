declare module 'citeproc' {
  export interface CiteprocSys {
    retrieveLocale: (lang: string) => string;
    retrieveItem: (id: string) => unknown;
  }

  export interface CiteprocEngine {
    updateItems(ids: string[]): void;
    setOutputFormat(format: 'html' | 'text' | 'rtf'): void;
    makeBibliography(): [unknown, string[]] | false;
    processCitationCluster(
      citation: unknown,
      citationsPre: unknown[],
      citationsPost: unknown[]
    ): [unknown, Array<[number, string]>];
  }

  export interface CiteprocStatic {
    Engine: new (
      sys: CiteprocSys,
      style: string,
      lang?: string,
      forceLang?: boolean
    ) => CiteprocEngine;
    PROCESSOR_VERSION: string;
  }

  const CSL: CiteprocStatic;
  export default CSL;
}
