# Seedance MCP Server

MCP Server for Volcengine Seedance Video Generation API

## Features

- 🎬 Text-to-Video (T2V) generation
- 🖼️ Image-to-Video (I2V) generation  
- 🔊 Audio generation support
- ⚡ SSE-based MCP protocol

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
ARK_API_KEY=your_volcengine_ark_api_key
PORT=3002
MCP_AUTH_TOKEN=your_optional_auth_token
```

Get your API key from: https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey

### 3. Run Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

- **SSE Endpoint**: `http://localhost:3002/sse`
- **Message Endpoint**: `http://localhost:3002/message`
- **Health Check**: `http://localhost:3002/health`

## Available Tools

### submit_video_task

Submit a video generation task to Seedance API.

**Parameters:**
- `prompt` (string, required): Text description of the video content
- `image_url` (string, optional): URL of reference image for I2V mode
- `generate_audio` (boolean, optional): Generate synchronized audio
- `draft` (boolean, optional): Generate low-resolution preview

**Returns:**
- `task_id`: Unique task identifier
- `status`: Current task status

### check_video_status

Query the status of a submitted video generation task.

**Parameters:**
- `task_id` (string, required): Task ID returned by submit_video_task

**Returns:**
- `status`: Task status (queued, running, succeeded, failed)
- `video_url`: Download URL (when succeeded)
- `video_duration`: Video duration in seconds
- `error`: Error message (if failed)

## Supported Models

- `doubao-seedance-1-0-lite-t2v-250428`: Text-to-Video Lite
- `doubao-seedance-1-0-lite-i2v-250428`: Image-to-Video Lite
- `doubao-seedance-1-0-pro-250528`: Seedance 1.0 Pro
- `doubao-seedance-1-5-pro-251215`: Seedance 1.5 Pro
- `doubao-seedance-2-0-260128`: Seedance 2.0 (Latest)

## License

MIT
