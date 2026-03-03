/**
 * Seedance 1.5 Pro API Client
 * 
 * Uses the Volcengine Ark API with simple API Key authentication.
 * API Docs: https://www.volcengine.com/docs/82379/1520757
 * 
 * - Create task: POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
 * - Query task:  GET  https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{id}
 */

const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

// The model ID for Seedance 1.5 Pro
const SEEDANCE_MODEL = "doubao-seedance-1-5-pro-251215";

interface ContentItem {
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string };
}

interface CreateTaskRequest {
    model: string;
    content: ContentItem[];
    generate_audio?: boolean;
    draft?: boolean;
    service_tier?: "default" | "flex";
    return_last_frame?: boolean;
}

interface CreateTaskResponse {
    id: string;
    model: string;
    status: string;
    created_at: number;
    updated_at: number;
    error?: { code: string; message: string };
}

interface TaskStatusResponse {
    id: string;
    model: string;
    status: string; // "queued" | "running" | "succeeded" | "failed" | "cancelled"
    created_at: number;
    updated_at: number;
    content?: {
        video_url?: string;
        last_frame_image?: string;
    };
    output?: {
        video_url?: string;
        video_duration?: number;
        last_frame_image?: string;
    };
    duration?: number; // 视频时长（秒）
    error?: { code: string; message: string };
    usage?: {
        completion_tokens?: number;
        total_tokens?: number;
    };
}

function getHeaders(): Record<string, string> {
    const ARK_API_KEY = process.env.ARK_API_KEY || "";
    if (!ARK_API_KEY) {
        throw new Error("ARK_API_KEY environment variable is not set. Get it from https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey");
    }
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ARK_API_KEY}`,
    };
}

/**
 * Submit a video generation task to Seedance 1.5 Pro.
 */
export async function submitSeedanceTask(params: {
    prompt: string;
    image_url?: string;
    generate_audio?: boolean;
    draft?: boolean;
}): Promise<{ task_id: string; status: string }> {
    const content: ContentItem[] = [];

    // Add text prompt
    content.push({ type: "text", text: params.prompt });

    // Add image if provided (for I2V)
    if (params.image_url) {
        content.push({
            type: "image_url",
            image_url: { url: params.image_url },
        });
    }

    const requestBody: CreateTaskRequest = {
        model: SEEDANCE_MODEL,
        content,
    };

    // Optional params
    if (params.generate_audio !== undefined) {
        requestBody.generate_audio = params.generate_audio;
    }
    if (params.draft !== undefined) {
        requestBody.draft = params.draft;
    }

    const url = `${ARK_BASE_URL}/contents/generations/tasks`;
    console.log(`[Seedance] Creating task: POST ${url}`);
    console.log(`[Seedance] Prompt: "${params.prompt.substring(0, 100)}${params.prompt.length > 100 ? '...' : ''}"`);
    if (params.image_url) {
        console.log(`[Seedance] Image URL provided (I2V mode)`);
    }

    const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Seedance] API Error:", errText);
        throw new Error(`Seedance API failed with status ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as CreateTaskResponse;

    if (data.error) {
        throw new Error(`Seedance API error: [${data.error.code}] ${data.error.message}`);
    }

    console.log(`[Seedance] Task created: id=${data.id}, status=${data.status}`);

    return {
        task_id: data.id,
        status: data.status,
    };
}

/**
 * Query the status of a Seedance video generation task.
 */
export async function getSeedanceTaskStatus(taskId: string): Promise<{
    status: string;
    video_url?: string;
    video_duration?: number;
    last_frame_image?: string;
    error?: string;
}> {
    const url = `${ARK_BASE_URL}/contents/generations/tasks/${taskId}`;
    console.log(`[Seedance] Querying task: GET ${url}`);

    const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Seedance] API Error:", errText);
        throw new Error(`Seedance API failed with status ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as TaskStatusResponse;

    // Debug: Log the complete API response
    console.log(`[Seedance] Raw API response for task ${taskId}:`, JSON.stringify(data, null, 2));

    if (data.error) {
        return {
            status: "failed",
            error: `[${data.error.code}] ${data.error.message}`,
        };
    }

    const result: {
        status: string;
        video_url?: string;
        video_duration?: number;
        last_frame_image?: string;
        error?: string;
    } = {
        status: data.status,
    };

    // If succeeded, extract the video URL from content or output
    if (data.status === "succeeded") {
        // Try content first (Seedance 1.5 Pro uses this)
        if (data.content && typeof data.content === 'object') {
            console.log(`[Seedance] Task succeeded, extracting from content:`, JSON.stringify(data.content, null, 2));
            result.video_url = data.content.video_url;
            result.last_frame_image = data.content.last_frame_image;
            result.video_duration = data.duration; // duration is at root level
        }
        // Fallback to output (for other models)
        else if (data.output) {
            console.log(`[Seedance] Task succeeded, extracting from output:`, JSON.stringify(data.output, null, 2));
            result.video_url = data.output.video_url;
            result.video_duration = data.output.video_duration;
            result.last_frame_image = data.output.last_frame_image;
        }
    } else {
        console.log(`[Seedance] Task status=${data.status}`);
    }

    console.log(`[Seedance] Task ${taskId}: status=${data.status}`);

    return result;
}
