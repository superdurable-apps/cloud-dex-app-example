import { FlowNotFoundError, IdReusePolicy, InitialAttribute, type Client } from "@superdurable/dex";

import { LANGUAGES, greetingFlow, greetingState, type GreetingState, type Language } from "./greeting-flow.ts";
import { HttpError, type ApiRequest, type ApiResponse, type Route } from "./http.ts";

const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAXIMUM_NAME = 80;
// A run that ended without saving its greeting reads as failed.
const ENDED_RUN = new Set(["failed", "cancelled", "terminated", "serverSideTimeoutInternalOnly"]);

/** The routes of openapi/openapi.yaml, over the Dex Client of the web process. */
export function greetingRoutes(client: Client): Route[] {
  return [
    { method: "POST", path: "/api/greetings", handle: (request) => submit(client, request) },
    { method: "GET", path: "/api/greetings/{requestId}", handle: (request) => read(client, requestIdOf(request.params.requestId)) },
  ];
}

function flowId(requestId: string): string {
  return `greeting-${requestId}`;
}

/** Starts the greeting of a valid name once per request ID; a repeat answers the same greeting. */
async function submit(client: Client, request: ApiRequest): Promise<ApiResponse> {
  const body = request.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "the request body must be a JSON object");
  }
  const { requestId: rawRequestId, name: rawName, language: rawLanguage } = body as Record<string, unknown>;
  const requestId = requestIdOf(rawRequestId);
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (name === "" || name.length > MAXIMUM_NAME) {
    throw new HttpError(400, `name must be 1 to ${MAXIMUM_NAME} characters`);
  }
  const language = rawLanguage ?? "english";
  if (!LANGUAGES.includes(language as Language)) {
    throw new HttpError(400, `language must be one of ${LANGUAGES.join(", ")}`);
  }
  const submitted = { name, language: language as Language };
  await client.startFlow(greetingFlow, flowId(requestId), submitted, {
    requestId,
    ignoreAlreadyStarted: true,
    idReusePolicy: IdReusePolicy.DISALLOW,
    attributes: [InitialAttribute.of(greetingState, { status: "composing", ...submitted })],
  });
  return { status: 202, body: { requestId, status: "composing" } };
}

/** The greeting's state, read from the Flow's Attribute; a run that ended before saving reads as failed. */
async function read(client: Client, requestId: string): Promise<ApiResponse> {
  let state: GreetingState | undefined;
  try {
    [state] = await client.getAttributes(flowId(requestId), greetingState);
  } catch (error) {
    if (error instanceof FlowNotFoundError) {
      throw new HttpError(404, "no greeting has this request ID");
    }
    throw error;
  }
  if (state === undefined) {
    throw new HttpError(404, "no greeting has this request ID");
  }
  if (state.status === "composing" && ENDED_RUN.has((await client.describeFlow(flowId(requestId))).status)) {
    return {
      status: 200,
      body: { requestId, status: "failed", name: state.name, language: state.language, notice: "This run failed. Studio Runs shows the cause." },
    };
  }
  return { status: 200, body: { requestId, ...state } };
}

function requestIdOf(value: unknown): string {
  if (typeof value !== "string" || !REQUEST_ID.test(value)) {
    throw new HttpError(400, "requestId must be a lower-case UUID");
  }
  return value;
}
