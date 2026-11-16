import { greetingRoutes } from "./greeting-api.ts";
import { greetingFlow } from "./greeting-flow.ts";
import { page } from "./page.ts";
import type { Application, ApplicationMode } from "./runtime.ts";

/** What the application loads with: the mode, and in API tests whatever a test replaces. */
export interface ApplicationOptions {
  readonly mode: ApplicationMode;
}

/** Every Flow the Worker runs, whose sources dex-app.yaml lists, the API of openapi/openapi.yaml and the page. */
export async function loadApplication(_options: ApplicationOptions): Promise<Application> {
  return { flows: [greetingFlow], routes: greetingRoutes, page };
}
