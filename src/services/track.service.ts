// src/services/track.service.ts
import { apiRequest } from "./api";
import { API } from "@/constants/api-endpoints";
import type {
  CheckinResult,
  InteractPayload,
  LabLogPayload,
  CheckoutPayload,
} from "@/types/tracking.types";
import type { ApiResult } from "@/types/api.types";
import type { AdminLabGame } from "@/types/admin.types";

export async function checkinExhibit(
  payload: { qrCodeIdentifier: string; sessionId: number }
): Promise<ApiResult<CheckinResult>> {
  return apiRequest<CheckinResult>(API.track.checkin, {
    method: "POST",
    body: {
      sessionId: payload.sessionId,
      qrCodeIdentifier: payload.qrCodeIdentifier,
    },
  });
}

export async function recordInteraction(
  payload: InteractPayload
): Promise<ApiResult<{ success: boolean }>> {
  return apiRequest<{ success: boolean }>(API.track.interact, {
    method: "PATCH",
    body: payload,
  });
}

export async function submitLabLog(
  payload: LabLogPayload
): Promise<ApiResult<{ success: boolean }>> {
  return apiRequest<{ success: boolean }>(API.track.labLog, {
    method: "POST",
    body: payload,
  });
}

export async function checkoutExhibit(
  payload: CheckoutPayload
): Promise<ApiResult<{ success: boolean }>> {
  return apiRequest<{ success: boolean }>(API.track.checkout, {
    method: "POST",
    body: payload,
  });
}

export async function getVisitorLabGames(
  exhibitId: number
): Promise<ApiResult<AdminLabGame[]>> {
  return apiRequest<AdminLabGame[]>(`${API.track.labGames}?exhibit_id=${exhibitId}`);
}
