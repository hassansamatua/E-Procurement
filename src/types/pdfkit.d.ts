declare module 'pdfkit' {
  import { Writable } from 'stream';

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margins?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
    layout?: 'portrait' | 'landscape';
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: Date;
    };
    bufferPages?: boolean;
    autoFirstPage?: boolean;
  }

  class PDFDocument extends Writable {
    constructor(options?: PDFDocumentOptions);
    
    font(name: string, path: string, family?: string): this;
    fontSize(size: number): this;
    fill(color: string): this;
    text(text: string, options?: { x?: number; y?: number; width?: number; align?: string }): this;
    moveDown(lines?: number): this;
    addPage(options?: { margin?: number; layout?: 'portrait' | 'landscape' }): this;
    pipe(destination: Writable): this;
    end(): void;
  }

  export = PDFDocument;
}
