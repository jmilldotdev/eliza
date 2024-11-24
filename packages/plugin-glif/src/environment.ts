import { IAgentRuntime } from "@ai16z/eliza";
import { z } from "zod";

export const glifEnvSchema = z.object({
    GLIF_API_TOKEN: z.string(),
    GLIF_API_URL: z.string().default("https://simple-api.glif.app"),
    GLIF_STRICT_MODE: z.boolean().default(false),
});

export type GlifConfig = z.infer<typeof glifEnvSchema>;

export async function validateGlifConfig(
    runtime: IAgentRuntime
): Promise<GlifConfig> {
    try {
        const config = {
            GLIF_API_TOKEN:
                runtime.getSetting("GLIF_API_TOKEN") ||
                process.env.GLIF_API_TOKEN,
            GLIF_API_URL:
                runtime.getSetting("GLIF_API_URL") || process.env.GLIF_API_URL,
            GLIF_STRICT_MODE:
                runtime.getSetting("GLIF_STRICT_MODE") === "true" ||
                process.env.GLIF_STRICT_MODE === "true",
        };

        return glifEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Glif configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}

export interface GlifResponse {
    id: string;
    inputs: Record<string, string>;
    output: string;
    outputFull: Record<string, any>;
    error?: string;
}

export interface GlifRunOptions {
    id: string;
    inputs: string[] | Record<string, string>;
}
