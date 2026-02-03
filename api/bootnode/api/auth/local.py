"""Local authentication for development.

In production, use Hanzo IAM (hanzo.id, zoo.id, lux.id, pars.id).
"""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from bootnode.api.deps import DbDep
from bootnode.config import get_settings
from bootnode.db.models import User

router = APIRouter()
settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    """Registration request."""

    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    """Login request."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response."""

    id: str
    name: str
    email: str
    org: str
    avatar: str | None
    roles: list[str]
    permissions: list[str]
    createdAt: str | None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response."""

    access_token: str
    token_type: str = "Bearer"
    user: UserResponse


def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token."""
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def hash_password(password: str) -> str:
    """Hash password."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def user_to_response(user: User) -> UserResponse:
    """Convert User model to response."""
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        org="local",
        avatar=user.avatar,
        roles=user.roles or ["user"],
        permissions=user.permissions or ["read", "write"],
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: DbDep) -> AuthResponse:
    """Register a new user."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password),
        roles=["user", "developer"],
        permissions=["read", "write", "api"],
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create access token
    access_token = create_access_token(str(user.id), user.email)

    return AuthResponse(
        access_token=access_token,
        user=user_to_response(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: DbDep) -> AuthResponse:
    """Login with email and password."""
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Update last login
    user.last_login_at = datetime.now(UTC)
    await db.commit()

    # Create access token
    access_token = create_access_token(str(user.id), user.email)

    return AuthResponse(
        access_token=access_token,
        user=user_to_response(user),
    )


async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: DbDep = None,
) -> UserResponse | None:
    """Get current user from JWT token."""
    if credentials is None:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = payload.get("sub")
        if user_id is None:
            return None

        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()

        if user is None:
            return None

        return user_to_response(user)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        return None


@router.get("/me", response_model=UserResponse)
async def get_me(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: DbDep = None,
) -> UserResponse:
    """Get current authenticated user."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        return user_to_response(user)

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
