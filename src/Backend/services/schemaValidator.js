import Ajv from "ajv";
import addFormats from "ajv-formats";
import { yangPushTelemetrySchema, YANG_VALIDATION_METADATA } from "../yang/schema.js";

const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false
});
addFormats(ajv);

const validateFn = ajv.compile(yangPushTelemetrySchema);

/**
 * Format an Ajv error into an actionable, human-readable rejection reason.
 */
function formatAjvError(err) {
  const path = err.instancePath ? err.instancePath.replace(/^\//, "").replace(/\//g, ".") : "root";
  
  switch (err.keyword) {
    case "required": {
      const missingProp = err.params.missingProperty;
      const fullPath = path === "root" ? missingProp : `${path}.${missingProp}`;
      return {
        field: fullPath,
        keyword: err.keyword,
        message: `Missing required field '${fullPath}' per YANG model specification.`
      };
    }
    case "type": {
      return {
        field: path,
        keyword: err.keyword,
        message: `Incorrect data type at '${path}': expected ${err.params.type}, received ${typeof err.data}.`
      };
    }
    case "enum": {
      const allowed = (err.params.allowedValues || []).join(", ");
      return {
        field: path,
        keyword: err.keyword,
        message: `Invalid value '${err.data}' at '${path}'. Allowed YANG enumeration values: [${allowed}].`
      };
    }
    case "minimum": {
      return {
        field: path,
        keyword: err.keyword,
        message: `Value out of range at '${path}': received ${err.data}, minimum allowed is ${err.params.limit}.`
      };
    }
    case "pattern": {
      return {
        field: path,
        keyword: err.keyword,
        message: `Invalid YANG schema path at '${path}': '${err.data}' does not match expected interface subtree.`
      };
    }
    case "additionalProperties": {
      const extra = err.params.additionalProperty;
      const fullPath = path === "root" ? extra : `${path}.${extra}`;
      return {
        field: fullPath,
        keyword: err.keyword,
        message: `Forbidden unrecognized property '${fullPath}' violates strict YANG node structure.`
      };
    }
    default: {
      return {
        field: path,
        keyword: err.keyword,
        message: `Validation failure at '${path}': ${err.message}`
      };
    }
  }
}

/**
 * Validates a candidate telemetry message against the YANG-push schema fallback engine.
 * @param {any} message
 * @returns {{ valid: boolean, schema_mode: string, summary: string, errors: Array<{ field: string, keyword: string, message: string }> }}
 */
export function validateTelemetryMessage(message) {
  if (!message || typeof message !== "object") {
    return {
      valid: false,
      schema_mode: YANG_VALIDATION_METADATA.mode,
      summary: "Malformed message: payload must be a valid non-empty JSON object.",
      errors: [
        {
          field: "root",
          keyword: "type",
          message: "Payload must be a JSON object."
        }
      ]
    };
  }

  const isValid = validateFn(message);

  if (isValid) {
    return {
      valid: true,
      schema_mode: YANG_VALIDATION_METADATA.mode,
      summary: "Message adheres to RFC 8641 / RFC 8343 YANG schema specifications.",
      errors: []
    };
  }

  const errors = (validateFn.errors || []).map(formatAjvError);
  const primaryError = errors[0] ? errors[0].message : "Unknown schema validation failure.";
  const summary = errors.length > 1 
    ? `${primaryError} (+${errors.length - 1} more schema violation${errors.length > 2 ? "s" : ""})`
    : primaryError;

  return {
    valid: false,
    schema_mode: YANG_VALIDATION_METADATA.mode,
    summary,
    errors
  };
}

export { YANG_VALIDATION_METADATA };
