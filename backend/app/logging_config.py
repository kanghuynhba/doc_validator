"""Centralised logging configuration."""

from __future__ import annotations

import logging
import sys


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def configure_logging(*, level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    fmt = "%(asctime)s %(levelname)-8s %(name)-30s %(message)s"
    handler.setFormatter(logging.Formatter(fmt, datefmt="%H:%M:%S"))

    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)

    for noisy in ("uvicorn.access", "uvicorn.asgi", "httpx", "openapi"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
