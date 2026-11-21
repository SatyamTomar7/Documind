import {
  GoogleGenAI,
  Type,
  type FunctionCallingConfigMode,
  type Content,
  type Part,
} from "@google/genai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import env from "../config/env";
import { documentTools } from "../tools/document.tools";
import {
  executeToolResult,
  type ToolExecutionResult,
} from "../tools/tool.executor";

/* -------------------------------------------------------------------------- */
/*                                   Clients                                  */
/* -------------------------------------------------------------------------- */

export const gemini = new GoogleGenAI({
  apiKey: env.gemini_api_key,
});

export const openai = env.openai_api_key
  ? new OpenAI({ apiKey: env.openai_api_key })
  : null;

// Groq's SDK otherwise waits one minute per attempt and retries twice. Since
// it is the final fallback, fail fast instead of leaving the API request open
// for several minutes when Groq is unavailable.
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS) || 20_000;
const groq = env.groq_api_key
  ? new Groq({
      apiKey: env.groq_api_key,
      timeout: GROQ_TIMEOUT_MS,
      maxRetries: 0,
    })
  : null;

/* -------------------------------------------------------------------------- */
/*                                   Models                                   */
/* -------------------------------------------------------------------------- */

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
export const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface AnswerResult {
  answer: string;
  citations: number[];
}

const toOpenAITools = (): OpenAI.Responses.FunctionTool[] =>
  documentTools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    strict: false,
    parameters: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([name, property]) => [
          name,
          {
            type: property.type === Type.INTEGER ? "integer" : "string",
            description: property.description,
          },
        ]),
      ),
      required: [...tool.parameters.required],
      additionalProperties: false,
    },
  }));

/* -------------------------------------------------------------------------- */
/*                            Shared prompt building                          */
/* -------------------------------------------------------------------------- */

const NO_ANSWER_MESSAGE =
  "I don't have enough information in the provided document.";

const CORE_RULES = `
You are a document question-answering assistant.

Answer the user's question using ONLY the provided context.

Rules:
- Do not use outside knowledge.
- Do not make up information.
- If the answer cannot be found in the context, say:
"${NO_ANSWER_MESSAGE}"
- Keep the answer clear and concise.
- Cite every factual claim.
- Each citation must refer only to a Source number present in the provided context.
- A citation must directly support the claim.
- Do not cite a source merely because it is generally related.
- Do not make claims that are not supported by the provided context.
- Do not combine information from unrelated sources unless the cited sources directly support the combined claim.
`.trim();

// Used by the non-streaming (structured JSON) path.
const JSON_SYSTEM_PROMPT = `
${CORE_RULES}

Output format:
Return valid JSON with exactly these fields and nothing else:
{
  "answer": "string",
  "citations": [1, 2]
}
- "answer" is plain text without inline citation markers.
- "citations" is an array of the integer Source numbers that support the answer.
Return the response as valid json with the keys "answer" and "citations".
`.trim();

// Used by the streaming path (plain text, inline citations).
const STREAM_SYSTEM_PROMPT = `
${CORE_RULES}

Output format:
- Respond in plain text (not JSON).
- Add inline citations right after each claim in exactly this format: [Source 1], [Source 2].
`.trim();

export type ConversationHistory = {
  role: "user" | "assistant";
  content: string;
}[];

const buildUserPrompt = (
  question: string,
  context: string,
  history: ConversationHistory = [],
) =>
  `
Conversation History (for understanding follow-up questions only):
${
  history.length > 0
    ? history.map((message) => `${message.role}: ${message.content}`).join("\n")
    : "No previous conversation."
}

Document Context (primary source of factual information):
${context}

Current Question:
${question}
`.trim();

/* -------------------------------------------------------------------------- */
/*                          Response parsing/validation                       */
/* -------------------------------------------------------------------------- */

const getValidSources = (context: string): Set<number> =>
  new Set(
    Array.from(context.matchAll(/Source\s+(\d+)/gi)).map((m) => Number(m[1])),
  );

const stripCodeFences = (text: string) =>
  text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

const parseAnswer = (
  raw: string | null | undefined,
  context: string,
): AnswerResult => {
  if (!raw) {
    throw new Error("Model returned an empty response");
  }

  const parsed = JSON.parse(stripCodeFences(raw));

  if (typeof parsed?.answer !== "string") {
    throw new Error("Model response is missing a valid 'answer' field");
  }

  const validSources = getValidSources(context);
  const rawCitations: unknown[] = Array.isArray(parsed.citations)
    ? parsed.citations
    : [];

  const citations = Array.from(
    new Set(
      rawCitations
        .map((c) => Number(c))
        .filter(
          (c) =>
            Number.isInteger(c) &&
            (validSources.size === 0 || validSources.has(c)),
        ),
    ),
  ).sort((a, b) => a - b);

  return { answer: parsed.answer, citations };
};

/* -------------------------------------------------------------------------- */
/*                         Non-streaming (structured JSON)                    */
/* -------------------------------------------------------------------------- */

const generateWithGemini = async (
  question: string,
  context: string,
  userId: number,
  history: ConversationHistory = [],
): Promise<AnswerResult> => {
  const MAX_TOOL_ROUNDS = 5;

  let contents: Content[] = [
    {
      role: "user",
      parts: [{ text: buildUserPrompt(question, context, history) }],
    },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: JSON_SYSTEM_PROMPT,
        temperature: 0,
        tools: [
          {
            functionDeclarations: [...documentTools],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "AUTO" as FunctionCallingConfigMode,
          },
        },
      },
    });

    const functionCalls = response.functionCalls ?? [];
    console.log(
      "Gemini tool calls:",
      functionCalls.map((call) => ({
        name: call.name,
        args: call.args,
      })),
    );
    // No tool calls: the model has returned its final answer.
    if (functionCalls.length === 0) {
      return parseAnswer(response.text, context);
    }

    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent) {
      throw new Error("Gemini returned no content for its function calls");
    }

    // Preserve the model's function-call message.
    contents.push(modelContent);

    // Execute every function call and return its result to Gemini.
    const functionResponses: Part[] = await Promise.all(
      functionCalls.map(async (functionCall): Promise<Part> => {
        if (!functionCall.name) {
          throw new Error("Gemini returned a function call without a name");
        }

        const toolResult = await executeToolResult(
          functionCall.name,
          functionCall.args ?? {},
          { userId },
        );
        console.log("Tool execution result:", toolResult);
        return {
          functionResponse: {
            name: functionCall.name,
            response: {
              result: toolResult,
            },
          },
        };
      }),
    );

    contents.push({
      role: "user",
      parts: functionResponses,
    });
  }

  throw new Error(
    `Gemini exceeded the maximum of ${MAX_TOOL_ROUNDS} tool-calling rounds`,
  );
};
const generateWithOpenAI = async (
  question: string,
  context: string,
  userId: number,
  history: ConversationHistory = [],
): Promise<AnswerResult> => {
  if (!openai) {
    throw new Error("OpenAI fallback is not configured");
  }

  const tools = toOpenAITools();
  const maxToolRounds = 5;
  let response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: JSON_SYSTEM_PROMPT,
    input: buildUserPrompt(question, context, history),
    tools,
    text: { format: { type: "json_object" } },
  });

  for (let round = 0; round < maxToolRounds; round++) {
    const functionCalls = response.output.filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
        item.type === "function_call",
    );

    if (functionCalls.length === 0) {
      return parseAnswer(response.output_text, context);
    }

    const functionOutputs = await Promise.all(
      functionCalls.map(async (functionCall) => {
        let args: unknown;
        let result: ToolExecutionResult;

        try {
          args = JSON.parse(functionCall.arguments);
        } catch {
          result = {
            ok: false,
            error: {
              code: "INVALID_TOOL_ARGUMENTS",
              message: "Tool arguments must be valid JSON",
            },
          };
          return {
            type: "function_call_output" as const,
            call_id: functionCall.call_id,
            output: JSON.stringify(result),
          };
        }

        result = await executeToolResult(functionCall.name, args, { userId });

        return {
          type: "function_call_output" as const,
          call_id: functionCall.call_id,
          output: JSON.stringify(result),
        };
      }),
    );

    response = await openai.responses.create({
      model: OPENAI_MODEL,
      instructions: JSON_SYSTEM_PROMPT,
      previous_response_id: response.id,
      input: functionOutputs,
      tools,
      text: { format: { type: "json_object" } },
    });
  }

  throw new Error(
    `OpenAI exceeded the maximum of ${maxToolRounds} tool-calling rounds`,
  );
};

const generateWithGroq = async (
  question: string,
  context: string,
  userId: number,
  history: ConversationHistory = [],
): Promise<AnswerResult> => {
  if (!groq) {
    throw new Error("Groq fallback is not configured");
  }

  const MAX_TOOL_ROUNDS = 5;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${JSON_SYSTEM_PROMPT}

TOOL-CALLING RULES:
- Use only the explicitly provided document tools.
- Never call a tool named "json".
- When no more tools are needed, return the final answer as plain JSON text.
- The final JSON must contain the keys "answer" and "citations".
- Do not wrap the final JSON in markdown code fences.`,
    },
    {
      role: "user",
      content: buildUserPrompt(question, context, history),
    },
  ];

  const tools: Groq.Chat.ChatCompletionTool[] = documentTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties).map(([name, property]) => [
            name,
            {
              type: property.type === Type.INTEGER ? "integer" : "string",
              description: property.description,
            },
          ]),
        ),
        required: [...tool.parameters.required],
      },
    },
  }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response;

    try {
      response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0,
        messages,
        tools,
        tool_choice: "auto",
      });
      console.log(
        "Groq response:",
        JSON.stringify(response.choices[0]?.message, null, 2),
      );
    } catch (error) {
      // Recover when Groq incorrectly treats the final JSON as a tool call.
      const apiError = error as {
        error?: {
          error?: {
            code?: string;
            failed_generation?: string;
          };
        };
      };

      const groqError = apiError.error?.error;
      const failedGeneration = groqError?.failed_generation;

      if (groqError?.code === "tool_use_failed" && failedGeneration) {
        try {
          const parsed = JSON.parse(failedGeneration);

          if (
            parsed.name === "json" &&
            typeof parsed.arguments === "object" &&
            parsed.arguments !== null
          ) {
            return parseAnswer(JSON.stringify(parsed.arguments), context);
          }
        } catch {
          // Preserve the original error if recovery parsing fails.
        }
      }

      throw error;
    }

    const assistantMessage = response.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error("Groq returned an empty response");
    }

    const toolCalls = assistantMessage.tool_calls ?? [];
    console.log(
      "Groq tool calls:",
      toolCalls.map((tool) => tool.function.name),
    );
    // No tool calls: parse the final model answer after all tool results.
    if (toolCalls.length === 0) {
      return parseAnswer(assistantMessage.content, context);
    }

    // Preserve the assistant's tool-call message.
    messages.push(assistantMessage);

    // Execute requested tools and return their results to Groq.
    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") {
        continue;
      }

      const toolName = toolCall.function.name;
      let toolResult: unknown;

      try {
        const args: unknown = JSON.parse(toolCall.function.arguments || "{}");

        toolResult = await executeToolResult(toolName, args, { userId });
      } catch (error) {
        toolResult = {
          ok: false,
          error: {
            code: "TOOL_EXECUTION_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Tool execution failed",
          },
        };
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  throw new Error(
    `Groq exceeded the maximum of ${MAX_TOOL_ROUNDS} tool-calling rounds`,
  );
};
export const generateAnswer = async (
  question: string,
  context: string,
  userId: number,
  history: ConversationHistory = [],
): Promise<AnswerResult> => {
  const failures: string[] = [];

  try {
    return await generateWithGemini(question, context, userId, history);
  } catch (error: unknown) {
    failures.push(`Gemini: ${describeProviderError(error)}`);
    console.error(
      `Gemini failed: ${describeProviderError(error)}. Trying OpenAI...`,
    );
  }

  try {
    return await generateWithOpenAI(question, context, userId, history);
  } catch (error: unknown) {
    failures.push(`OpenAI: ${describeProviderError(error)}`);
    console.error(
      `OpenAI failed: ${describeProviderError(error)}. Trying Groq...`,
    );
  }

  try {
    return await generateWithGroq(question, context, userId, history);
  } catch (error: unknown) {
    failures.push(`Groq: ${describeProviderError(error)}`);
    console.error(`Groq failed: ${describeProviderError(error)}`);

    throw new Error(
      `All LLM providers failed. ${failures.join(" | ")}`,
      { cause: error },
    );
  }
};

/* -------------------------------------------------------------------------- */
/*                          Streaming (plain text + fallback)                 */
/* -------------------------------------------------------------------------- */

type ChunkHandler = (chunk: string) => void;

const describeProviderError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return String(error);
};

const streamWithGemini = async (
  question: string,
  context: string,
  onChunk: ChunkHandler,
  history: ConversationHistory = [],
) => {
  const response = await gemini.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: buildUserPrompt(question, context, history),
    config: {
      systemInstruction: STREAM_SYSTEM_PROMPT,
      temperature: 0,
    },
  });

  for await (const chunk of response) {
    if (chunk.text) onChunk(chunk.text);
  }
};

const streamWithOpenAI = async (
  question: string,
  context: string,
  onChunk: ChunkHandler,
  history: ConversationHistory = [],
) => {
  if (!openai) {
    throw new Error("OpenAI fallback is not configured");
  }

  const stream = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: STREAM_SYSTEM_PROMPT,
    input: buildUserPrompt(question, context, history),
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "response.output_text.delta" && event.delta) {
      onChunk(event.delta);
    }
  }
};

const streamWithGroq = async (
  question: string,
  context: string,
  onChunk: ChunkHandler,
  history: ConversationHistory = [],
) => {
  if (!groq) {
    throw new Error("Groq fallback is not configured");
  }

  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0,
    stream: true,
    messages: [
      { role: "system", content: STREAM_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildUserPrompt(question, context, history),
      },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) onChunk(text);
  }
};

export const generateAnswerStream = async (
  question: string,
  context: string,
  onChunk: ChunkHandler,
  history: ConversationHistory = [],
): Promise<void> => {
  // Once any text has reached the client we can't cleanly switch providers,
  // so fallback is only attempted if a provider fails before emitting output.
  let emitted = false;
  const trackedOnChunk: ChunkHandler = (chunk) => {
    emitted = true;
    onChunk(chunk);
  };

  const providers: Array<{
    name: string;
    run: (
      q: string,
      c: string,
      cb: ChunkHandler,
      h: ConversationHistory,
    ) => Promise<void>;
  }> = [
    { name: "Gemini", run: streamWithGemini },
    { name: "OpenAI", run: streamWithOpenAI },
    { name: "Groq", run: streamWithGroq },
  ];

  const failures: string[] = [];

  for (const provider of providers) {
    try {
      await provider.run(question, context, trackedOnChunk, history);
      return;
    } catch (error: unknown) {
      failures.push(`${provider.name}: ${describeProviderError(error)}`);
      console.error(
        `${provider.name} stream failed: ${describeProviderError(error)}`,
      );

      if (emitted) {
        throw error;
      }
    }
  }

  throw new Error(`All LLM providers failed. ${failures.join(" | ")}`);
};
export const rewriteQuestion = async (
  question: string,
  history: ConversationHistory,
): Promise<string> => {
  if (history.length === 0) {
    return question;
  }

  const prompt = `
Rewrite the current question as a standalone question using conversation history
to resolve references such as "it", "they", and "that".

Rules:
- Preserve the user's original intent.
- Do not answer the question.
- Do not introduce facts that are not supported by the conversation.
- Return only the rewritten question.

Conversation history:
${history.map((message) => `${message.role}: ${message.content}`).join("\n")}

Current question:
${question}
`.trim();

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0,
      },
    });

    const rewritten = response.text?.trim();

    return rewritten || question;
  } catch (error) {
    console.error("Question rewriting failed:", error);
    return question;
  }
};
