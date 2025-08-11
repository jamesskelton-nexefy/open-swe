import { createPDFProcessorTool } from "../pdf-processor.js";

describe("PDFProcessor", () => {
  it("should create PDF processor tool with correct schema", () => {
    const tool = createPDFProcessorTool();
    
    expect(tool.name).toBe("pdf_processor");
    expect(tool.description).toContain("Extracts text content from base64 encoded PDF files");
  });

  it("should handle invalid base64 data gracefully", async () => {
    const tool = createPDFProcessorTool();
    
    const result = await tool.invoke({
      base64Data: "invalid-base64-data",
      filename: "test.pdf"
    });

    expect(result.status).toBe("error");
    expect(result.error).toBeDefined();
    expect(result.text).toBe("");
  });

  it("should handle empty base64 data", async () => {
    const tool = createPDFProcessorTool();
    
    const result = await tool.invoke({
      base64Data: "",
      filename: "empty.pdf"
    });

    expect(result.status).toBe("error");
    expect(result.error).toBeDefined();
  });
});
