import os, uuid, base64
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()
app = FastAPI(title="ATY AI STUDIO API", version="0.1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)
OUT = Path(os.getenv("OUTPUT_DIR", "outputs"))
OUT.mkdir(parents=True, exist_ok=True)

class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=3000)
    negative_prompt: Optional[str] = ""
    aspect_ratio: str = "9:16"

@app.get("/health")
def health():
    return {"status": "ok", "app": "ATY AI STUDIO", "version": "0.1.0"}

def hf_client():
    token = os.getenv("HF_TOKEN")
    if not token:
        raise HTTPException(503, "HF_TOKEN belum dipasang di server.")
    return InferenceClient(api_key=token)

@app.post("/v1/image")
def generate_image(req: GenerateRequest):
    try:
        client = hf_client()
        image = client.text_to_image(
            prompt=req.prompt,
            model=os.getenv("IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")
        )
        name = f"{uuid.uuid4().hex}.png"
        path = OUT / name
        image.save(path)
        return {"status": "completed", "filename": name, "url": f"/outputs/{name}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Image provider error: {str(e)[:300]}")

@app.post("/v1/video")
def generate_video(req: GenerateRequest):
    try:
        client = InferenceClient(
            provider=os.getenv("VIDEO_PROVIDER", "fal-ai"),
            api_key=os.getenv("HF_TOKEN")
        )
        video = client.text_to_video(
            req.prompt,
            model=os.getenv("VIDEO_MODEL", "Wan-AI/Wan2.2-TI2V-5B")
        )
        name = f"{uuid.uuid4().hex}.mp4"
        path = OUT / name
        # Current huggingface_hub versions return video bytes for text_to_video.
        path.write_bytes(video if isinstance(video, bytes) else bytes(video))
        return {"status": "completed", "filename": name, "url": f"/outputs/{name}"}
    except Exception as e:
        raise HTTPException(502, f"Video provider error or model unavailable: {str(e)[:300]}")

@app.post("/v1/speech")
async def generate_speech(text: str = Form(...), voice: str = Form("id-ID-GadisNeural")):
    try:
        import edge_tts
        name = f"{uuid.uuid4().hex}.mp3"
        path = OUT / name
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(path))
        return {"status": "completed", "filename": name, "url": f"/outputs/{name}"}
    except Exception as e:
        raise HTTPException(502, f"TTS error: {str(e)[:300]}")

from fastapi.staticfiles import StaticFiles
app.mount("/outputs", StaticFiles(directory=str(OUT)), name="outputs")
