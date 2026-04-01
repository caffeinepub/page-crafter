declare function html2canvas(
  element: Element,
  options?: {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string;
    logging?: boolean;
    width?: number;
    height?: number;
  },
): Promise<HTMLCanvasElement>;

declare const jspdf: {
  jsPDF: new (options?: {
    orientation?: "p" | "l" | "portrait" | "landscape";
    unit?: "mm" | "pt" | "px" | "cm";
    format?: string | number[];
  }) => {
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): void;
    addPage(): void;
    save(filename: string): void;
    output(type: string): any;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  };
};
