import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { parseRslXmlToEditableContent } from "@/lib/rsl-parser-server";
import { RslContent } from "@/lib/rsl-generator";
import { validateRslDataComprehensive } from "@/lib/rsl-validator";

const validateRequestSchema = z.object({
  xmlContent: z.string().min(1, "XML content is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { xmlContent } = validateRequestSchema.parse(body);

    // Parse the XML content to extract RSL data
    let rslContents: RslContent[];
    
    try {
      // Try to parse as RSL XML
      const editableContents = parseRslXmlToEditableContent(xmlContent, "");
      
      // Convert editable content to RSL content format for validation
      rslContents = editableContents.map(content => ({
        url: content.url,
        rsl: {
          licenseServer: content.licenseServer,
          encrypted: content.encrypted,
          lastModified: content.lastModified,
          licenses: content.licenses,
          metadata: content.metadata,
        }
      }));
    } catch (parseError) {
      // If parsing fails, it's likely invalid XML or not RSL format
      return NextResponse.json({
        isValid: false,
        errors: ["Invalid RSL XML format or malformed XML structure"],
        warnings: [],
        results: [{
          type: "error",
          message: "Failed to parse RSL XML. Please check the XML syntax and RSL structure.",
          context: "XML Parsing"
        }]
      });
    }

    // Validate the parsed RSL content
    const validationResult = validateRslDataComprehensive(rslContents);

    return NextResponse.json({
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      results: validationResult.results,
    });

  } catch (error) {
    console.error("RSL validation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          isValid: false,
          errors: error.errors.map(e => e.message),
          warnings: [],
          results: error.errors.map(e => ({
            type: "error" as const,
            message: e.message,
            context: "Request Validation"
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        isValid: false,
        errors: ["Internal server error during validation"],
        warnings: [],
        results: [{
          type: "error" as const,
          message: "An unexpected error occurred during validation. Please try again.",
          context: "Server Error"
        }]
      },
      { status: 500 }
    );
  }
}
