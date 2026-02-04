"""Factory for creating deployers based on configuration."""

from functools import lru_cache
from pathlib import Path

import structlog

from bootnode.config import get_settings
from bootnode.core.deploy.base import DeployTarget

logger = structlog.get_logger()


@lru_cache
def get_deployer() -> DeployTarget:
    """Get the configured deployer instance.

    Returns a cached deployer based on the deploy_target setting:
    - "docker": DockerDeployer using docker compose
    - "process": ProcessDeployer for local development
    - "kubernetes": KubernetesDeployer for k8s clusters

    Returns:
        DeployTarget instance configured for the current environment.

    Raises:
        ValueError: If deploy_target is not recognized.
    """
    settings = get_settings()

    if settings.deploy_target == "docker":
        from bootnode.core.deploy.docker import DockerDeployer

        compose_file = Path(settings.deploy_compose_file)
        deployer = DockerDeployer(compose_file=compose_file)
        logger.info(
            "Using Docker deployer",
            compose_file=str(compose_file),
        )
        return deployer

    elif settings.deploy_target == "process":
        from bootnode.core.deploy.process import ProcessDeployer

        deployer = ProcessDeployer()
        logger.info("Using Process deployer for local development")
        return deployer

    elif settings.deploy_target == "kubernetes":
        from bootnode.core.deploy.kubernetes import KubernetesDeployer

        deployer = KubernetesDeployer(
            namespace=settings.deploy_k8s_namespace,
            context=settings.deploy_k8s_context or None,
        )
        logger.info(
            "Using Kubernetes deployer",
            namespace=settings.deploy_k8s_namespace,
            context=settings.deploy_k8s_context or "default",
        )
        return deployer

    else:
        raise ValueError(f"Unknown deploy target: {settings.deploy_target}")


def clear_deployer_cache() -> None:
    """Clear the cached deployer instance.

    Useful for testing or when configuration changes.
    """
    get_deployer.cache_clear()
