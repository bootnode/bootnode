"""Local process deployment target for development."""

import asyncio
import os
import signal
import sys
from pathlib import Path
from typing import AsyncIterator

import structlog

from bootnode.core.deploy.base import DeployTarget, ServiceStatus, ServiceType

logger = structlog.get_logger()


# Command mapping for local processes
SERVICE_COMMANDS: dict[ServiceType, tuple[str, list[str]]] = {
    ServiceType.API: (
        "uvicorn",
        ["bootnode.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    ),
    ServiceType.WEB: (
        "npm",
        ["run", "dev"],
    ),
    ServiceType.INDEXER: (
        sys.executable,
        ["-m", "bootnode.workers.indexer"],
    ),
    ServiceType.WEBHOOK_WORKER: (
        sys.executable,
        ["-m", "bootnode.workers.webhook"],
    ),
    ServiceType.BUNDLER: (
        sys.executable,
        ["-m", "bootnode.workers.bundler"],
    ),
}

# Working directories for services
SERVICE_CWD: dict[ServiceType, str | None] = {
    ServiceType.API: None,  # Uses project root
    ServiceType.WEB: "web",  # Web frontend directory
    ServiceType.INDEXER: None,
    ServiceType.WEBHOOK_WORKER: None,
    ServiceType.BUNDLER: None,
}


class ProcessInfo:
    """Information about a running process."""

    def __init__(
        self,
        process: asyncio.subprocess.Process,
        command: str,
        started_at: str,
    ) -> None:
        self.process = process
        self.command = command
        self.started_at = started_at
        self.log_buffer: list[str] = []
        self.max_log_lines = 1000


class ProcessDeployer(DeployTarget):
    """Run services as local processes for development.

    This deployer runs each service as a subprocess, useful for
    local development without Docker.
    """

    def __init__(self, project_root: Path | str | None = None) -> None:
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self._processes: dict[ServiceType, ProcessInfo] = {}
        self._log_tasks: dict[ServiceType, asyncio.Task] = {}

    def _get_command(self, service: ServiceType) -> tuple[str, list[str]]:
        """Get command and args for a service."""
        return SERVICE_COMMANDS.get(service, (service.value, []))

    def _get_cwd(self, service: ServiceType) -> Path:
        """Get working directory for a service."""
        cwd = SERVICE_CWD.get(service)
        if cwd:
            return self.project_root / cwd
        return self.project_root

    async def _read_output(
        self,
        service: ServiceType,
        stream: asyncio.StreamReader,
    ) -> None:
        """Read output from a process and buffer it."""
        try:
            while True:
                line = await stream.readline()
                if not line:
                    break
                decoded = line.decode().rstrip("\n")
                if service in self._processes:
                    info = self._processes[service]
                    info.log_buffer.append(decoded)
                    if len(info.log_buffer) > info.max_log_lines:
                        info.log_buffer.pop(0)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error("Error reading process output", service=service.value, error=str(e))

    async def deploy(
        self,
        service: ServiceType,
        image: str,
        replicas: int = 1,
        env: dict[str, str] | None = None,
    ) -> bool:
        """Start a service as a local process.

        Note: 'image' parameter is ignored for process deployer.
        Only one replica is supported for local processes.
        """
        if service in self._processes:
            info = self._processes[service]
            if info.process.returncode is None:
                logger.warning("Service already running", service=service.value)
                return True

        cmd, args = self._get_command(service)
        cwd = self._get_cwd(service)

        # Build environment
        proc_env = os.environ.copy()
        if env:
            proc_env.update(env)

        try:
            from datetime import datetime, timezone

            process = await asyncio.create_subprocess_exec(
                cmd,
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=cwd,
                env=proc_env,
            )

            started_at = datetime.now(timezone.utc).isoformat()
            info = ProcessInfo(
                process=process,
                command=f"{cmd} {' '.join(args)}",
                started_at=started_at,
            )
            self._processes[service] = info

            # Start log reader task
            if process.stdout:
                task = asyncio.create_task(
                    self._read_output(service, process.stdout)
                )
                self._log_tasks[service] = task

            logger.info(
                "Service started",
                service=service.value,
                pid=process.pid,
                command=info.command,
                cwd=str(cwd),
            )
            return True

        except FileNotFoundError:
            logger.error(
                "Command not found",
                service=service.value,
                command=cmd,
            )
            return False
        except Exception as e:
            logger.error(
                "Failed to start service",
                service=service.value,
                error=str(e),
            )
            return False

    async def scale(self, service: ServiceType, replicas: int) -> bool:
        """Scale a service.

        Note: Local process deployer only supports 0 or 1 replica.
        """
        if replicas == 0:
            return await self.destroy(service)
        elif replicas == 1:
            if service not in self._processes:
                # Can't scale up without knowing what to run
                logger.warning(
                    "Cannot scale up - service not previously deployed",
                    service=service.value,
                )
                return False
            return True
        else:
            logger.warning(
                "Process deployer only supports 1 replica",
                service=service.value,
                requested=replicas,
            )
            return False

    async def status(self, service: ServiceType) -> ServiceStatus:
        """Get the current status of a service."""
        if service not in self._processes:
            return ServiceStatus(
                name=service.value,
                running=False,
                replicas=0,
                ready_replicas=0,
            )

        info = self._processes[service]
        is_running = info.process.returncode is None

        return ServiceStatus(
            name=service.value,
            running=is_running,
            replicas=1 if is_running else 0,
            ready_replicas=1 if is_running else 0,
            image=info.command,
            started_at=info.started_at,
        )

    async def logs(
        self,
        service: ServiceType,
        tail: int = 100,
        follow: bool = False,
    ) -> AsyncIterator[str]:
        """Stream logs from a service."""
        if service not in self._processes:
            return

        info = self._processes[service]

        # Return buffered logs
        start_idx = max(0, len(info.log_buffer) - tail)
        for line in info.log_buffer[start_idx:]:
            yield line

        if follow and info.process.returncode is None:
            # Continue streaming new logs
            last_idx = len(info.log_buffer)
            while info.process.returncode is None:
                await asyncio.sleep(0.1)
                if len(info.log_buffer) > last_idx:
                    for line in info.log_buffer[last_idx:]:
                        yield line
                    last_idx = len(info.log_buffer)

    async def destroy(self, service: ServiceType) -> bool:
        """Stop and remove a service process."""
        if service not in self._processes:
            return True

        info = self._processes[service]

        # Cancel log reader task
        if service in self._log_tasks:
            self._log_tasks[service].cancel()
            try:
                await self._log_tasks[service]
            except asyncio.CancelledError:
                pass
            del self._log_tasks[service]

        # Terminate process
        if info.process.returncode is None:
            try:
                info.process.terminate()
                try:
                    await asyncio.wait_for(info.process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    info.process.kill()
                    await info.process.wait()
            except ProcessLookupError:
                pass

        del self._processes[service]
        logger.info("Service stopped", service=service.value)
        return True

    async def destroy_all(self) -> None:
        """Stop all running services."""
        services = list(self._processes.keys())
        for service in services:
            await self.destroy(service)
