import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { submitSeedanceTask, getSeedanceTaskStatus } from "./seedance.js";

export function registerTools(server: Server) {
    // 1. List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "submit_video_task",
                    description:
                        "提交视频生成任务到 Seedance 1.5 Pro (字节跳动)。支持文生视频 (T2V) 和图生视频 (I2V)。" +
                        "任务提交后会返回 task_id，需要用 check_video_status 工具查询结果。" +
                        "生成的视频最高支持 2160p 分辨率，支持音画同步输出。",
                    inputSchema: {
                        type: "object",
                        properties: {
                            prompt: {
                                type: "string",
                                description:
                                    "视频内容的文本描述（提示词）。请详细描述想要生成的视频场景、动作、风格等。最大 1000 字符。",
                            },
                            image_url: {
                                type: "string",
                                description:
                                    "可选。参考图片的 URL 地址，用于图生视频 (I2V) 模式。提供后将以该图片作为视频的首帧参考。",
                            },
                            generate_audio: {
                                type: "boolean",
                                description:
                                    "可选，默认 true。是否生成同步音频（包括人声、音效、背景音乐）。仅 Seedance 1.5 Pro 支持。",
                            },
                            draft: {
                                type: "boolean",
                                description:
                                    "可选，默认 false。是否开启样片 (Draft) 模式。样片模式仅生成 480p 低分辨率预览，成本更低，适合快速验证创意。",
                            },
                        },
                        required: ["prompt"],
                    },
                },
                {
                    name: "check_video_status",
                    description:
                        "查询已提交的 Seedance 视频生成任务状态。" +
                        "任务可能处于 queued（排队中）、running（生成中）、succeeded（成功）、failed（失败）等状态。" +
                        "成功后会返回视频下载 URL。",
                    inputSchema: {
                        type: "object",
                        properties: {
                            task_id: {
                                type: "string",
                                description: "submit_video_task 返回的任务 ID。",
                            },
                        },
                        required: ["task_id"],
                    },
                },
            ],
        };
    });

    // 2. Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            if (request.params.name === "submit_video_task") {
                const prompt = String(request.params.arguments?.prompt || "");
                const imageUrl = request.params.arguments?.image_url
                    ? String(request.params.arguments.image_url)
                    : undefined;
                const generateAudio = request.params.arguments?.generate_audio as
                    | boolean
                    | undefined;
                const draft = request.params.arguments?.draft as boolean | undefined;

                if (!prompt) {
                    throw new McpError(ErrorCode.InvalidParams, "prompt is required");
                }

                const result = await submitSeedanceTask({
                    prompt,
                    image_url: imageUrl,
                    generate_audio: generateAudio,
                    draft,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text:
                                `✅ 视频生成任务已提交！\n` +
                                `Task ID: ${result.task_id}\n` +
                                `当前状态: ${result.status}\n\n` +
                                `请稍等片刻，然后使用 check_video_status 工具查询结果。\n` +
                                `通常视频生成需要 1-3 分钟。`,
                        },
                    ],
                };
            }

            if (request.params.name === "check_video_status") {
                const taskId = String(request.params.arguments?.task_id || "");
                if (!taskId) {
                    throw new McpError(ErrorCode.InvalidParams, "task_id is required");
                }

                const result = await getSeedanceTaskStatus(taskId);

                let textResult = "";
                if (result.status === "succeeded") {
                    textResult =
                        `✅ 视频生成完成！\n` +
                        `视频下载链接: ${result.video_url}\n` +
                        (result.video_duration
                            ? `视频时长: ${result.video_duration} 秒\n`
                            : "") +
                        (result.last_frame_image
                            ? `尾帧图片: ${result.last_frame_image}\n`
                            : "");
                } else if (
                    result.status === "queued" ||
                    result.status === "running"
                ) {
                    textResult =
                        `⏳ 任务状态: ${result.status === "queued" ? "排队中" : "生成中"}\n` +
                        `视频正在生成中，请稍后再次查询。`;
                } else if (result.status === "failed") {
                    textResult =
                        `❌ 任务失败\n` +
                        `错误信息: ${result.error || "未知错误"}`;
                } else if (result.status === "cancelled") {
                    textResult = `⚠️ 任务已取消`;
                } else {
                    textResult =
                        `任务状态: ${result.status}\n` +
                        (result.error ? `错误信息: ${result.error}` : "");
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: textResult,
                        },
                    ],
                };
            }

            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
            );
        } catch (error: any) {
            if (error instanceof McpError) throw error;
            console.error(error);
            return {
                content: [
                    {
                        type: "text",
                        text: `执行工具时出错: ${error.message || String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
}
