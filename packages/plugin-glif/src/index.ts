import { elizaLogger } from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";
import {
    validateGlifConfig,
    GlifResponse,
    GlifRunOptions,
} from "./environment";

async function runGlif(
    options: GlifRunOptions,
    runtime: IAgentRuntime
): Promise<GlifResponse> {
    const config = await validateGlifConfig(runtime);
    const url = `${config.GLIF_API_URL}${config.GLIF_STRICT_MODE ? "?strict=1" : ""}`;
    console.log("url", url);
    console.log("config", config);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.GLIF_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
    });

    if (!response.ok) {
        throw new Error(`Glif API error: ${response.statusText}`);
    }

    return response.json();
}

const glifGeneration: Action = {
    name: "RUN_GLIF",
    similes: ["EXECUTE_GLIF", "USE_GLIF", "GLIF_GENERATE"],
    description: "Run a Glif with specified inputs",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        try {
            await validateGlifConfig(runtime);
            return true;
        } catch {
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { glifId: string },
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Running Glif with message:", message);

        try {
            const result = await runGlif(
                {
                    id: "cm3v80ldx002a3hfq6gvolzcp",
                    // inputs: [message.content.text],
                    inputs: [
                        "Sam Bankman-Fried tweets about the potential of on-chain AI agents",
                    ],
                },
                runtime
            );

            if (result.error) {
                throw new Error(result.error);
            }

            // Handle the output based on outputFull type
            // You might want to handle different output types differently
            callback({
                text:
                    typeof result.output === "string"
                        ? result.output
                        : JSON.stringify(result.output),
                attachments: result.output.startsWith("http")
                    ? [
                          {
                              id: crypto.randomUUID(),
                              url: result.output,
                              title: "Glif Generation",
                              source: "glifGeneration",
                              description: "Glif Generation",
                              text: result.output,
                          },
                      ]
                    : undefined,
            });
        } catch (error) {
            elizaLogger.error("Glif generation failed:", error);
            callback({
                text: `Failed to run Glif: ${error.message}`,
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Run Glif with prompt: a cute robot" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here's the Glif output",
                    action: "RUN_GLIF",
                },
            },
        ],
    ],
};

export const glifPlugin: Plugin = {
    name: "glif",
    description: "Run Glifs via the Glif API",
    actions: [glifGeneration],
    evaluators: [],
    providers: [],
};
