/**
 * Convert Zod schema to JSON Schema.
 *
 * Based on pattern from:
 * claude-code-main/src/utils/zodToJsonSchema.ts
 * claude-code-main/src/utils/api.ts:157
 *
 * This bridges your Zod tool definitions
 * to the JSON Schema format LLM APIs expect.
 */

import type { z } from "zod";
import type { ToolInputJSONSchema } from "../types/index.js";

export function zodToJsonSchema(
  schema: z.ZodType,
): ToolInputJSONSchema {
  // For z.object schemas, extract shape
  if ("shape" in schema && schema.shape) {
    const shape = schema.shape as Record<
      string,
      z.ZodType
    >;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(
      shape,
    )) {
      properties[key] = zodFieldToJsonSchema(value);

      // Check if field is required
      // (not optional, not nullable)
      if (!isOptional(value)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0
        ? { required }
        : {}),
    };
  }

  return { type: "object" };
}

function zodFieldToJsonSchema(
  field: z.ZodType,
): Record<string, unknown> {
  const description = field.description;
  const base: Record<string, unknown> = {};

  if (description) {
    base.description = description;
  }

  // Handle optional wrapper
  if (isOptional(field) && "unwrap" in field) {
    const inner = (
      field as { unwrap: () => z.ZodType }
    ).unwrap();
    return { ...zodFieldToJsonSchema(inner), ...base };
  }

  // Detect type from Zod internals
  const typeName = getZodTypeName(field);

  switch (typeName) {
    case "ZodString":
      return { type: "string", ...base };
    case "ZodNumber":
      return { type: "number", ...base };
    case "ZodBoolean":
      return { type: "boolean", ...base };
    case "ZodArray":
      return {
        type: "array",
        items: zodFieldToJsonSchema(
          (field as any)._def.type,
        ),
        ...base,
      };
    case "ZodEnum":
      return {
        type: "string",
        enum: (field as any)._def.values,
        ...base,
      };
    case "ZodLiteral":
      return {
        type: typeof (field as any)._def.value,
        const: (field as any)._def.value,
        ...base,
      };
    default:
      return { type: "string", ...base };
  }
}

function isOptional(field: z.ZodType): boolean {
  const typeName = getZodTypeName(field);
  return (
    typeName === "ZodOptional" ||
    typeName === "ZodNullable"
  );
}

function getZodTypeName(field: z.ZodType): string {
  if ("_def" in field) {
    const def = (field as any)._def;
    return def.typeName || "";
  }
  return "";
}
