"""OAuth callback endpoint for Hanzo IAM integration."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from bootnode.config import get_settings
from bootnode.core.iam import IAMClient, IAMUser, get_current_user

router = APIRouter()
settings = get_settings()


class OAuthCallbackRequest(BaseModel):
    """OAuth callback request."""

    code: str
    state: str


class OAuthCallbackResponse(BaseModel):
    """OAuth callback response."""

    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600


@router.post("/oauth/callback", response_model=OAuthCallbackResponse)
async def oauth_callback(request: OAuthCallbackRequest) -> OAuthCallbackResponse:
    """Handle OAuth callback from Hanzo IAM."""
    try:
        # Exchange authorization code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                f"{settings.iam_url}/oauth2/token",
                data={
                    "grant_type": "authorization_code",
                    "code": request.code,
                    "client_id": settings.iam_client_id,
                    "client_secret": settings.iam_client_secret,
                    "redirect_uri": f"{settings.frontend_url}/auth/callback",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code for token",
                )

            token_data = token_response.json()
            access_token = token_data["access_token"]

            # Verify token and get user info
            iam_client = IAMClient()
            user = await iam_client.verify_token(access_token)

            # Check if user's organization is allowed
            if user.org not in settings.allowed_orgs:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Organization '{user.org}' is not allowed",
                )

            return OAuthCallbackResponse(
                access_token=access_token,
                expires_in=token_data.get("expires_in", 3600),
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}",
        )


@router.get("/me")
async def get_current_user_info(user: IAMUser = Depends(get_current_user)):
    """Get current authenticated user from Hanzo IAM."""
    return user