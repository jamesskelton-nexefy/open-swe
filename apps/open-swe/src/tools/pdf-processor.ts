import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createLogger, LogLevel } from "../utils/logger.js";

// Dynamic import for pdf-parse to handle ES modules
let pdfParse: any;
const getPdfParse = async () => {
  if (!pdfParse) {
    try {
      pdfParse = (await import("pdf-parse")).default;
    } catch (error) {
      // Fallback to require for CommonJS compatibility
      pdfParse = eval('require')("pdf-parse");
    }
  }
  return pdfParse;
};

const logger = createLogger(LogLevel.INFO, "PDFProcessor");

const pdfProcessorSchema = z.object({
  base64Data: z
    .string()
    .describe("The base64 encoded PDF data to extract text from"),
  filename: z
    .string()
    .optional()
    .describe("Optional filename for logging and metadata purposes"),
});

export interface PDFProcessingResult {
  text: string;
  metadata: {
    pages: number;
    info?: any;
    filename?: string;
    wordCount: number;
    characterCount: number;
  };
  status: "success" | "error";
  error?: string;
}

export const createPDFProcessorTool = () => {
  return tool(
    async (input): Promise<PDFProcessingResult> => {
      const { base64Data, filename } = input;

      try {
        logger.info("Starting PDF text extraction", {
          filename,
          dataLength: base64Data.length,
        });

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(base64Data, "base64");

        // Extract text using pdf-parse
        const pdfParseLib = await getPdfParse();
        const pdfData = await pdfParseLib(pdfBuffer);

        const wordCount = pdfData.text.split(/\s+/).filter(Boolean).length;
        const characterCount = pdfData.text.length;

        const result: PDFProcessingResult = {
          text: pdfData.text,
          metadata: {
            pages: pdfData.numpages,
            info: pdfData.info,
            filename,
            wordCount,
            characterCount,
          },
          status: "success",
        };

        logger.info("PDF text extraction completed successfully", {
          filename,
          pages: pdfData.numpages,
          wordCount,
          characterCount,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error("PDF text extraction failed", {
          filename,
          error: errorMessage,
        });

        return {
          text: "",
          metadata: {
            pages: 0,
            filename,
            wordCount: 0,
            characterCount: 0,
          },
          status: "error",
          error: errorMessage,
        };
      }
    },
    {
      name: "pdf_processor",
      description: "Extracts text content from base64 encoded PDF files and provides metadata about the document",
      schema: pdfProcessorSchema,
    }
  );
};

export function createPDFProcessorToolFields() {
  return {
    name: "pdf_processor",
    description: "Extracts text content from base64 encoded PDF files and provides metadata about the document",
    schema: pdfProcessorSchema,
  };
}


