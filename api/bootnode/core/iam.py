"""Hanzo IAM integration for multi-tenant authentication.

Supports login via:
- hanzo.id (Hanzo org)
- zoo.id (Zoo Labs org)
- lux.id (Lux Network org)
- pars.id (Pars org)

Uses Casdoor-compatible OAuth2/OIDC flow.
"""

import httpx
from functools import lru_cache
from typing import Any
from datetime import datetime, timezone
import jwt
from jwt import PyJWKClient
from pydantic import BaseModel
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from bootnode.config import get_settings


class IAMUser(BaseModel):
    """User from Hanzo IAM."""
    
    id: str
    name: str
    email: str
    org: str  # hanzo, zoo, lux, pars
    avatar: str | None = None
    roles: list[str] = []
    permissions: list[str] = []
    created_at: datetime | None = None
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        return "admin" in self.roles
    
    @property
    def can_create_projects(self) -> bool:
        """Check if user can create projects."""
        return "projects:write" in self.permissions or self.is_admin


class IAMClient:
    """Client for Hanzo IAM service."""
    
    def __init__(self):
        self.settings = get_settings()
        self._jwks_client: PyJWKClient | None = None
    
    @property
    def jwks_client(self) -> PyJWKClient:
        """Get JWKS client (lazy initialization)."""
        if self._jwks_client is None:
            jwks_url = f"{self.settings.iam_url}/.well-known/jwks.json"
            self._jwks_client = PyJWKClient(jwks_url)
        return self._jwks_client
    
    async def verify_token(self, token: str) -> IAMUser:
        """Verify JWT token from hanzo.id and return user."""
        try:
            # Get signing key from JWKS
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            
            # Decode and verify token
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                audience=self.settings.iam_client_id,
                issuer=self.settings.iam_url,
            )
            
            # Extract user info
            return IAMUser(
                id=payload.get("sub"),
                name=payload.get("name", ""),
                email=payload.get("email", ""),
                org=payload.get("org", "hanzo"),
                avatar=payload.get("avatar"),
                roles=payload.get("roles", []),
                permissions=payload.get("permissions", []),
                created_at=datetime.fromtimestamp(
                    payload.get("iat", 0), tz=timezone.utc
                ),
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
            )
    
    async def exchange_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        """Exchange authorization code for tokens."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.settings.iam_url}/api/login/oauth/access_token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.settings.iam_client_id,
                    "client_secret": self.settings.iam_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to exchange code for token",
                )
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> IAMUser:
        """Get user info from IAM using access token."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.settings.iam_url}/api/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get user info",
                )
            
            data = response.json()
            return IAMUser(
                id=data.get("sub"),
                name=data.get("name", ""),
                email=data.get("email", ""),
                org=data.get("org", "hanzo"),
                avatar=data.get("avatar"),
                roles=data.get("roles", []),
                permissions=data.get("permissions", []),
            )
    
    def get_login_url(self, redirect_uri: str, org: str = "hanzo") -> str:
        """Get login URL for specific org."""
        org_domains = {
            "hanzo": "hanzo.id",
            "zoo": "zoo.id", 
            "lux": "lux.id",
            "pars": "pars.id",
        }
        domain = org_domains.get(org, "hanzo.id")
        
        return (
            f"https://{domain}/login/oauth/authorize"
            f"?client_id={self.settings.iam_client_id}"
            f"&response_type=code"
            f"&redirect_uri={redirect_uri}"
            f"&scope=openid+profile+email"
            f"&state={org}"
        )


# Dependency injection
@lru_cache()
def get_iam_client() -> IAMClient:
    """Get IAM client singleton."""
    return IAMClient()


# Security scheme
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    iam: IAMClient = Depends(get_iam_client),
) -> IAMUser:
    """Get current authenticated user from hanzo.id token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return await iam.verify_token(credentials.credentials)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    iam: IAMClient = Depends(get_iam_client),
) -> IAMUser | None:
    """Get current user if authenticated, None otherwise."""
    if credentials is None:
        return None
    
    try:
        return await iam.verify_token(credentials.credentials)
    except HTTPException:
        return None


def require_org(allowed_orgs: list[str]):
    """Dependency that requires user to be from specific org(s)."""
    async def _require_org(user: IAMUser = Depends(get_current_user)) -> IAMUser:
        if user.org not in allowed_orgs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to orgs: {allowed_orgs}",
            )
        return user
    return _require_org


def require_permission(permission: str):
    """Dependency that requires user to have specific permission."""
    async def _require_permission(user: IAMUser = Depends(get_current_user)) -> IAMUser:
        if permission not in user.permissions and not user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {permission}",
            )
        return user
    return _require_permission
