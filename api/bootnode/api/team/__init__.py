"""Team management API."""

import secrets
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, select, update

from bootnode.api.deps import DbDep, ProjectDep
from bootnode.db.models import TeamMember, User

router = APIRouter()


class TeamMemberResponse(BaseModel):
    """Team member response."""

    id: str
    email: str
    name: str | None
    role: str
    status: str
    avatar: str | None = None
    joined_at: str | None
    created_at: str

    class Config:
        from_attributes = True


class InviteMemberRequest(BaseModel):
    """Invite member request."""

    email: EmailStr
    role: str = "viewer"


class UpdateMemberRequest(BaseModel):
    """Update member request."""

    role: str | None = None
    name: str | None = None


class TeamListResponse(BaseModel):
    """Team list response."""

    members: list[TeamMemberResponse]
    total: int


@router.get("", response_model=TeamListResponse)
async def list_team_members(
    project: ProjectDep,
    db: DbDep,
) -> TeamListResponse:
    """List all team members for the project."""
    # Get team members
    result = await db.execute(
        select(TeamMember).where(TeamMember.project_id == project.id)
    )
    members = result.scalars().all()

    # Get user details for linked members
    member_responses = []
    for member in members:
        avatar = None
        name = member.name

        if member.user_id:
            user_result = await db.execute(
                select(User).where(User.id == member.user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                avatar = user.avatar
                name = name or user.name

        member_responses.append(
            TeamMemberResponse(
                id=str(member.id),
                email=member.email,
                name=name,
                role=member.role,
                status=member.status,
                avatar=avatar,
                joined_at=member.joined_at.isoformat() if member.joined_at else None,
                created_at=member.created_at.isoformat(),
            )
        )

    return TeamListResponse(members=member_responses, total=len(member_responses))


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    request: InviteMemberRequest,
    project: ProjectDep,
    db: DbDep,
) -> TeamMemberResponse:
    """Invite a new team member."""
    # Check if member already exists
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.project_id == project.id,
            TeamMember.email == request.email,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member with this email already exists",
        )

    # Check if user exists
    user_result = await db.execute(select(User).where(User.email == request.email))
    user = user_result.scalar_one_or_none()

    # Create team member
    member = TeamMember(
        project_id=project.id,
        user_id=user.id if user else None,
        email=request.email,
        name=user.name if user else None,
        role=request.role,
        status="active" if user else "pending",
        invite_token=None if user else secrets.token_urlsafe(32),
        joined_at=datetime.now(UTC) if user else None,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return TeamMemberResponse(
        id=str(member.id),
        email=member.email,
        name=member.name,
        role=member.role,
        status=member.status,
        avatar=user.avatar if user else None,
        joined_at=member.joined_at.isoformat() if member.joined_at else None,
        created_at=member.created_at.isoformat(),
    )


@router.patch("/{member_id}", response_model=TeamMemberResponse)
async def update_member(
    member_id: str,
    request: UpdateMemberRequest,
    project: ProjectDep,
    db: DbDep,
) -> TeamMemberResponse:
    """Update a team member's role or details."""
    # Get member
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.id == uuid.UUID(member_id),
            TeamMember.project_id == project.id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )

    # Update fields
    if request.role:
        member.role = request.role
    if request.name:
        member.name = request.name

    await db.commit()
    await db.refresh(member)

    # Get user avatar
    avatar = None
    if member.user_id:
        user_result = await db.execute(select(User).where(User.id == member.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            avatar = user.avatar

    return TeamMemberResponse(
        id=str(member.id),
        email=member.email,
        name=member.name,
        role=member.role,
        status=member.status,
        avatar=avatar,
        joined_at=member.joined_at.isoformat() if member.joined_at else None,
        created_at=member.created_at.isoformat(),
    )


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: str,
    project: ProjectDep,
    db: DbDep,
) -> None:
    """Remove a team member."""
    # Check member exists
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.id == uuid.UUID(member_id),
            TeamMember.project_id == project.id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )

    # Delete member
    await db.execute(
        delete(TeamMember).where(TeamMember.id == uuid.UUID(member_id))
    )
    await db.commit()
