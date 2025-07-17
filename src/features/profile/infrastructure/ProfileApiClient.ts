/**
 * ProfileApiClient
 * Handles API communication for profile update operations
 * Following functional programming approach
 */

// Type definitions
export type ProfileUpdateRequest = {
  readonly display_name?: string;
  readonly bio?: string;
};

export type ProfileUpdateResponse = {
  readonly display_name?: string;
  readonly bio?: string;
  readonly profile_image_url?: string;
};

export type ApiConfig = {
  readonly baseUrl: string;
  readonly credentials: RequestCredentials;
};

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  credentials: 'include'
};

// Utility function for API response handling
export const handleProfileApiResponse = async <T>(response: Response, errorMessage: string): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorMessage);
  }
  return await response.json();
};

// Pure function for profile update
export const updateProfile = async (
  request: ProfileUpdateRequest,
  config: ApiConfig = DEFAULT_CONFIG
): Promise<ProfileUpdateResponse> => {
  const response = await fetch(`${config.baseUrl}/users/me/profile`, {
    method: 'PUT',
    credentials: config.credentials,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return handleProfileApiResponse(response, 'プロフィールの更新に失敗しました');
};

// Legacy class wrapper for backward compatibility
export class ProfileApiClient {
  private readonly config: ApiConfig;

  constructor(baseUrl?: string) {
    this.config = {
      baseUrl: baseUrl || DEFAULT_CONFIG.baseUrl,
      credentials: DEFAULT_CONFIG.credentials
    };
  }

  async updateProfile(request: ProfileUpdateRequest): Promise<ProfileUpdateResponse> {
    return updateProfile(request, this.config);
  }
}