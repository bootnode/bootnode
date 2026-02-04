"""Docker Compose deployment target."""

import asyncio
import subprocess
from pathlib import Path
from typing import AsyncIterator

import structlog

from bootnode.core.deploy.base import DeployTarget, ServiceStatus, ServiceType

logger = structlog.get_logger()


# Service name mapping for docker compose
SERVICE_NAMES: dict[ServiceType, str] = {
    ServiceType.API: "api",
    ServiceType.WEB: "web",
    ServiceType.INDEXER: "indexer",
    ServiceType.WEBHOOK_WORKER: "webhook-worker",
    ServiceType.BUNDLER: "bundler",
}


class DockerDeployer(DeployTarget):
    """Deploy services using Docker Compose.

    Uses docker compose CLI for orchestration and docker SDK for inspection.
    """

    def __init__(
        self,
        compose_file: Path | str = Path("infra/compose.yml"),
        project_name: str = "bootnode",
    ) -> None:
        self.compose_file = Path(compose_file)
        self.project_name = project_name
        self._docker_client = None

    @property
    def docker_client(self):
        """Lazy-load docker client."""
        if self._docker_client is None:
            try:
                import docker

                self._docker_client = docker.from_env()
            except Exception as e:
                logger.error("Failed to connect to Docker", error=str(e))
                raise RuntimeError("Docker not available") from e
        return self._docker_client

    def _compose_cmd(self, *args: str) -> list[str]:
        """Build docker compose command."""
        return [
            "docker",
            "compose",
            "-f",
            str(self.compose_file),
            "-p",
            self.project_name,
            *args,
        ]

    async def _run_compose(self, *args: str) -> tuple[int, str, str]:
        """Run docker compose command asynchronously."""
        cmd = self._compose_cmd(*args)
        logger.debug("Running compose command", cmd=" ".join(cmd))

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        return proc.returncode or 0, stdout.decode(), stderr.decode()

    def _get_service_name(self, service: ServiceType) -> str:
        """Get docker compose service name."""
        return SERVICE_NAMES.get(service, service.value)

    def _get_container_name(self, service: ServiceType) -> str:
        """Get full container name."""
        return f"{self.project_name}-{self._get_service_name(service)}-1"

    async def deploy(
        self,
        service: ServiceType,
        image: str,
        replicas: int = 1,
        env: dict[str, str] | None = None,
    ) -> bool:
        """Deploy a service using docker compose up."""
        service_name = self._get_service_name(service)

        # Build environment args
        env_args = []
        if env:
            for key, value in env.items():
                env_args.extend(["-e", f"{key}={value}"])

        # Pull latest image if specified
        if image and ":" in image:
            pull_cmd = ["docker", "pull", image]
            proc = await asyncio.create_subprocess_exec(
                *pull_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()

        # Run docker compose up with scale
        args = ["up", "-d", "--scale", f"{service_name}={replicas}"]
        if image:
            args.extend(["--pull", "always"])
        args.append(service_name)

        returncode, stdout, stderr = await self._run_compose(*args)

        if returncode != 0:
            logger.error(
                "Deploy failed",
                service=service_name,
                returncode=returncode,
                stderr=stderr,
            )
            return False

        logger.info(
            "Service deployed",
            service=service_name,
            replicas=replicas,
            image=image,
        )
        return True

    async def scale(self, service: ServiceType, replicas: int) -> bool:
        """Scale a service to the specified number of replicas."""
        service_name = self._get_service_name(service)

        returncode, stdout, stderr = await self._run_compose(
            "up",
            "-d",
            "--scale",
            f"{service_name}={replicas}",
            "--no-recreate",
            service_name,
        )

        if returncode != 0:
            logger.error(
                "Scale failed",
                service=service_name,
                replicas=replicas,
                stderr=stderr,
            )
            return False

        logger.info("Service scaled", service=service_name, replicas=replicas)
        return True

    async def status(self, service: ServiceType) -> ServiceStatus:
        """Get the current status of a service."""
        service_name = self._get_service_name(service)
        container_prefix = f"{self.project_name}-{service_name}"

        try:
            containers = self.docker_client.containers.list(
                all=True,
                filters={"name": container_prefix},
            )

            if not containers:
                return ServiceStatus(
                    name=service_name,
                    running=False,
                    replicas=0,
                    ready_replicas=0,
                )

            running_count = 0
            ready_count = 0
            image = None
            started_at = None
            cpu_usage = None
            memory_usage = None

            for container in containers:
                if container.status == "running":
                    running_count += 1
                    # Check health if available
                    health = container.attrs.get("State", {}).get("Health", {})
                    if health.get("Status") == "healthy" or not health:
                        ready_count += 1

                    # Get image from first running container
                    if image is None:
                        image = container.image.tags[0] if container.image.tags else None
                        started_at = container.attrs.get("State", {}).get("StartedAt")

                    # Get resource usage
                    try:
                        stats = container.stats(stream=False)
                        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                            stats["precpu_stats"]["cpu_usage"]["total_usage"]
                        system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                            stats["precpu_stats"]["system_cpu_usage"]
                        if system_delta > 0:
                            cpu_pct = (cpu_delta / system_delta) * 100.0
                            cpu_usage = round(cpu_pct, 2) if cpu_usage is None else cpu_usage + cpu_pct

                        mem_usage = stats["memory_stats"].get("usage", 0)
                        mem_limit = stats["memory_stats"].get("limit", 1)
                        mem_pct = (mem_usage / mem_limit) * 100.0
                        memory_usage = round(mem_pct, 2) if memory_usage is None else memory_usage + mem_pct
                    except Exception:
                        pass

            return ServiceStatus(
                name=service_name,
                running=running_count > 0,
                replicas=len(containers),
                ready_replicas=ready_count,
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                image=image,
                started_at=started_at,
            )

        except Exception as e:
            logger.error("Failed to get status", service=service_name, error=str(e))
            return ServiceStatus(
                name=service_name,
                running=False,
                replicas=0,
                ready_replicas=0,
            )

    async def logs(
        self,
        service: ServiceType,
        tail: int = 100,
        follow: bool = False,
    ) -> AsyncIterator[str]:
        """Stream logs from a service."""
        service_name = self._get_service_name(service)

        args = ["logs", f"--tail={tail}"]
        if follow:
            args.append("-f")
        args.append(service_name)

        cmd = self._compose_cmd(*args)

        if follow:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            if proc.stdout:
                async for line in proc.stdout:
                    yield line.decode().rstrip("\n")
        else:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            stdout, _ = await proc.communicate()
            for line in stdout.decode().splitlines():
                yield line

    async def destroy(self, service: ServiceType) -> bool:
        """Stop and remove a service."""
        service_name = self._get_service_name(service)

        returncode, stdout, stderr = await self._run_compose(
            "rm",
            "-f",
            "-s",
            "-v",
            service_name,
        )

        if returncode != 0:
            logger.error(
                "Destroy failed",
                service=service_name,
                stderr=stderr,
            )
            return False

        logger.info("Service destroyed", service=service_name)
        return True

    async def restart(self, service: ServiceType) -> bool:
        """Restart a service using docker compose restart."""
        service_name = self._get_service_name(service)

        returncode, stdout, stderr = await self._run_compose(
            "restart",
            service_name,
        )

        if returncode != 0:
            logger.error(
                "Restart failed",
                service=service_name,
                stderr=stderr,
            )
            return False

        logger.info("Service restarted", service=service_name)
        return True
