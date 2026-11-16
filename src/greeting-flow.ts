import {
  Attribute,
  StepList,
  goTo,
  gracefulComplete,
  jsonCodec,
  type Context,
  type Flow,
  type PersistenceSchema,
  type Step,
  type StepDecision,
} from "@superdurable/dex";

/** The languages a greeting can be written in. */
export const LANGUAGES = ["english", "spanish", "french"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Where one greeting is: being written, then ready. */
export type GreetingStatus = "composing" | "ready";

/** What a person submitted. */
export interface GreetingRequest {
  readonly name: string;
  readonly language: Language;
}

/** The greeting's whole state, which the API reads with one Attribute read. */
export interface GreetingState {
  readonly status: GreetingStatus;
  readonly name: string;
  readonly language: Language;
  readonly greeting?: string;
}

export const greetingState = new Attribute("greeting-state", jsonCodec<GreetingState>({ typeName: "GreetingState" }));
const greetingRequest = jsonCodec<GreetingRequest>({ typeName: "GreetingRequest" });

const SALUTATIONS: Readonly<Record<Language, string>> = { english: "Hello", spanish: "Hola", french: "Bonjour" };

// dex:group group-id:compose group-label:"Compose"
// dex:explanation text:"Write the greeting of the submitted name in the chosen language."
class ComposeGreeting implements Step<GreetingRequest> {
  public readonly inputCodec = greetingRequest;

  public getStepType(): string {
    return "ComposeGreeting";
  }

  public execute(_context: Context, request: GreetingRequest): StepDecision {
    return goTo(SaveGreeting, { ...request, greeting: `${SALUTATIONS[request.language]}, ${request.name}!` });
  }
}

/** The composed greeting, which SaveGreeting keeps. */
interface ComposedGreeting extends GreetingRequest {
  readonly greeting: string;
}

// dex:group group-id:result group-label:"Result"
// dex:explanation text:"Save the greeting, which the page then shows."
class SaveGreeting implements Step<ComposedGreeting> {
  public readonly inputCodec = jsonCodec<ComposedGreeting>({ typeName: "ComposedGreeting" });

  public getStepType(): string {
    return "SaveGreeting";
  }

  public execute(context: Context, composed: ComposedGreeting): StepDecision {
    greetingState.set(context, { status: "ready", name: composed.name, language: composed.language, greeting: composed.greeting });
    return gracefulComplete();
  }
}

/** One greeting a person submitted, written and saved. FlowID greeting-<requestId>. */
export class GreetingFlow implements Flow<GreetingRequest> {
  public getFlowType(): string {
    return "GreetingFlow";
  }

  public getSteps() {
    return StepList.startStep(new ComposeGreeting()).otherSteps(new SaveGreeting());
  }

  public getPersistenceSchema(): PersistenceSchema {
    return { attributes: [greetingState] };
  }
}

export const greetingFlow = new GreetingFlow();
