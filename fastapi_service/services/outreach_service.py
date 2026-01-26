import asyncio
from core.outreach_generator.outreach_generator import run_email_generation
from .ws_manager import manager

from configs import prompt_templates


def run_outreach_job(job_id: str, batch_size: int, prompt: str | None, word_limit: int):
    total = batch_size
    completed = 0

    def progress_callback():
        nonlocal completed
        completed += 1

        asyncio.run(
            manager.send(
                job_id, {"type": "progress", "completed": completed, "total": total}
            )
        )

    try:
        run_email_generation(
            EMAIL_BATCH_SIZE=batch_size,
            PROMPT=prompt,
            EMAIL_WORD_LIMIT=word_limit,
            progress_callback=progress_callback,
        )

        asyncio.run(
            manager.send(
                job_id, {"type": "completed", "message": "Outreach generation finished"}
            )
        )

    except Exception as e:
        asyncio.run(manager.send(job_id, {"type": "failed", "error": str(e)}))
