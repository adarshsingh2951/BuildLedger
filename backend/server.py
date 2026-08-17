"""
BuildLedger backend supervisor bridge.

The cloud environment supervisor is configured to launch `uvicorn server:app` from
`/app/backend`. This project uses a Node.js / Express (MERN) backend that lives in
`/app/backend-node`. This module boots that Node process on an internal port and
transparently reverse-proxies every request to it, so the preview URL keeps
working without touching supervisor config.

The canonical source of truth for backend logic lives in `/app/backend-node`.
"""
from __future__ import annotations

import atexit
import os
import signal
import subprocess
import time
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

NODE_DIR = Path("/app/backend-node")
NODE_PORT = int(os.environ.get("NODE_BACKEND_PORT", "4000"))
NODE_URL = f"http://127.0.0.1:{NODE_PORT}"

_node_process: subprocess.Popen | None = None


def _spawn_node() -> None:
    """Start the Node.js MERN backend as a child process."""
    global _node_process
    if _node_process and _node_process.poll() is None:
        return
    env = os.environ.copy()
    env["PORT"] = str(NODE_PORT)
    env.setdefault("MONGO_URL", "mongodb://localhost:27017")
    env.setdefault("DB_NAME", "test_database")
    env.setdefault("JWT_SECRET", "buildledger-mvp-secret-2026-change-before-production")
    env.setdefault("FRONTEND_URL", "http://localhost:3000")
    env.setdefault("COOKIE_SECURE", "false")
    _node_process = subprocess.Popen(
        ["node", "src/server.js"],
        cwd=str(NODE_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )


def _stop_node() -> None:
    global _node_process
    if _node_process and _node_process.poll() is None:
        try:
            os.killpg(os.getpgid(_node_process.pid), signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            pass
    _node_process = None


atexit.register(_stop_node)


async def _wait_for_node(timeout: float = 20.0) -> bool:
    deadline = time.monotonic() + timeout
    async with httpx.AsyncClient(timeout=1.5) as client:
        while time.monotonic() < deadline:
            try:
                response = await client.get(f"{NODE_URL}/api/")
                if response.status_code < 500:
                    return True
            except httpx.HTTPError:
                pass
            time.sleep(0.4)
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    _spawn_node()
    await _wait_for_node()
    try:
        yield
    finally:
        _stop_node()


app = FastAPI(title="BuildLedger Bridge", lifespan=lifespan)


HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "transfer-encoding",
    "upgrade",
    "proxy-authorization",
    "proxy-authenticate",
    "te",
    "trailer",
    "host",
    "content-length",
    "content-encoding",
}


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "BuildLedger", "stack": "MERN", "canonical_backend": "/app/backend-node"}


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy(path: str, request: Request) -> Response:
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP}
    url = f"{NODE_URL}/api/{path}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            upstream = await client.request(
                request.method,
                url,
                params=request.query_params,
                content=body,
                headers=headers,
                cookies=request.cookies,
            )
    except httpx.HTTPError as exc:
        return JSONResponse({"detail": f"Upstream unavailable: {exc}"}, status_code=502)

    response_headers = {k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP}
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )
