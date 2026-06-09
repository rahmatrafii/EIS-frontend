// src/services/admin.service.ts
import { apiRequest } from "./api";
import { API } from "@/constants/api-endpoints";
import type { AdminExhibit, AdminExhibitDetail, AdminExhibitMedia, AdminLearningContent, AdminQuiz, AdminLabGame } from "@/types/admin.types";
import type { ApiResult } from "@/types/api.types";



/** Mengambil semua exhibit (admin) — GET /admin/exhibits */
export async function getAdminExhibits(): Promise<ApiResult<AdminExhibit[]>> {
  const result = await apiRequest<any[]>(API.admin.exhibits);
  if (!result.success) return result;

  const mapped: AdminExhibit[] = result.data.map((item) => ({
    id: item.id,
    name: item.name,
    zone_name: item.zoneName ?? item.zone_name,
    description: item.description ?? "",
    image_url: item.imageUrl ?? item.image_url ?? null,
    qr_code_identifier: item.qrCodeIdentifier ?? item.qr_code_identifier,
    is_active: item.isActive ?? item.is_active,
    created_at: item.createdAt ?? item.created_at,
    content_status: {
      CHILD: {
        hasText: item.content_status?.CHILD?.text ?? false,
        hasMedia: item.content_status?.CHILD?.media ?? false,
      },
      TEEN: {
        hasText: item.content_status?.TEEN?.text ?? false,
        hasMedia: item.content_status?.TEEN?.media ?? false,
      },
      ADULT: {
        hasText: item.content_status?.ADULT?.text ?? false,
        hasMedia: item.content_status?.ADULT?.media ?? false,
      },
    },
  }));

  return { success: true, data: mapped };
}

/** Nonaktifkan exhibit (soft delete) — DELETE /admin/exhibits/{id} */
export async function deactivateExhibit(
  exhibitId: number
): Promise<ApiResult<{ message: string }>> {
  const result = await apiRequest<unknown>(
    API.admin.exhibitById(String(exhibitId)),
    { method: "DELETE" }
  );

  if (!result.success) return result;

  return {
    success: true,
    data: { message: "Kandang berhasil dinonaktifkan." },
  };
}

/** Aktifkan exhibit — POST /admin/exhibits/{id}/activate */
export async function activateExhibit(
  exhibitId: number
): Promise<ApiResult<{ message: string }>> {
  const result = await apiRequest<unknown>(
    API.admin.activateExhibit(String(exhibitId)),
    { method: "POST" }
  );

  if (!result.success) return result;

  return {
    success: true,
    data: { message: "Kandang berhasil diaktifkan." },
  };
}

/** Hapus permanen exhibit — DELETE /admin/exhibits/{id}/permanent */
export async function hardDeleteExhibit(
  exhibitId: number
): Promise<ApiResult<{ message: string }>> {
  const result = await apiRequest<unknown>(
    API.admin.permanentExhibit(String(exhibitId)),
    { method: "DELETE" }
  );

  if (!result.success) return result;

  return {
    success: true,
    data: { message: "Kandang berhasil dihapus secara permanen." },
  };
}

/** Create exhibit — POST /admin/exhibits */
export async function createExhibit(payload: {
  name: string;
  zone_name: string;
  description: string;
  image_url?: string | null;
}): Promise<ApiResult<AdminExhibit>> {
  const result = await apiRequest<any>(API.admin.exhibits, {
    method: "POST",
    body: {
      name: payload.name,
      zoneName: payload.zone_name,
      description: payload.description,
      imageUrl: payload.image_url,
    },
  });

  if (!result.success) return result;

  const data = result.data;
  return {
    success: true,
    data: {
      id: data.id,
      name: data.name,
      zone_name: data.zoneName || data.zone_name,
      description: data.description,
      image_url: data.imageUrl ?? data.image_url ?? null,
      qr_code_identifier: data.qrCodeIdentifier || data.qr_code_identifier,
      is_active: data.isActive !== undefined ? data.isActive : data.is_active,
      created_at: data.createdAt || data.created_at,
      content_status: data.content_status || {
        CHILD: { hasText: false, hasMedia: false },
        TEEN: { hasText: false, hasMedia: false },
        ADULT: { hasText: false, hasMedia: false },
      },
    },
  };
}

/** Create content — POST /admin/content */
export async function createContent(payload: {
  exhibit_id: string;
  title: string;
  body: string;
  age_category: string;
}): Promise<ApiResult<{ id: number }>> {
  return apiRequest<{ id: number }>(API.admin.content, {
    method: "POST",
    body: payload,
  });
}



/** Mengambil detail exhibit tunggal — GET /admin/exhibits/{id} */
export async function getAdminExhibitDetail(exhibitId: number): Promise<ApiResult<AdminExhibitDetail>> {
  return apiRequest<AdminExhibitDetail>(
    API.admin.exhibitById(String(exhibitId))
  );
}


/** Menyimpan perubahan informasi dasar kandang — PUT /admin/exhibits/{id} */
export async function updateExhibitDetail(
  exhibitId: number,
  payload: { name: string; zone_name: string; description: string; image_url?: string | null }
): Promise<ApiResult<AdminExhibit>> {
  const result = await apiRequest<any>(
    API.admin.exhibitById(String(exhibitId)),
    {
      method: "PUT",
      body: {
        name: payload.name,
        zoneName: payload.zone_name,
        description: payload.description,
        imageUrl: payload.image_url,
      },
    }
  );
  if (!result.success) return result;

  const item = result.data;
  const mapped: AdminExhibit = {
    id: item.id,
    name: item.name,
    zone_name: item.zoneName ?? item.zone_name,
    description: item.description ?? "",
    image_url: item.imageUrl ?? item.image_url ?? null,
    qr_code_identifier: item.qrCodeIdentifier ?? item.qr_code_identifier,
    is_active: item.isActive ?? item.is_active,
    created_at: item.createdAt ?? item.created_at,
    content_status: {
      CHILD: {
        hasText: item.content_status?.CHILD?.text ?? false,
        hasMedia: item.content_status?.CHILD?.media ?? false,
      },
      TEEN: {
        hasText: item.content_status?.TEEN?.text ?? false,
        hasMedia: item.content_status?.TEEN?.media ?? false,
      },
      ADULT: {
        hasText: item.content_status?.ADULT?.text ?? false,
        hasMedia: item.content_status?.ADULT?.media ?? false,
      },
    },
  };

  return { success: true, data: mapped };
}

/** Menyimpan/Membuat konten edukasi baru — POST /admin/content */
export async function saveExhibitContent(payload: {
  exhibitId: number;
  ageCategory: "CHILD" | "TEEN" | "ADULT";
  contentTitle: string;
  contentBody: string;
}): Promise<ApiResult<{ id: number }>> {
  return apiRequest<{ id: number }>(API.admin.content, {
    method: "POST",
    body: payload,
  });
}

/** Menyimpan data media baru — POST /admin/media */
export async function saveExhibitMedia(payload: {
  exhibitId: number;
  ageCategory: "CHILD" | "TEEN" | "ADULT" | "ALL";
  mediaType: "AUDIO" | "VIDEO" | "IMAGE_INFOGRAPHIC" | "INTERACTIVE_LAB";
  title: string;
  fileUrl: string;
}): Promise<ApiResult<AdminExhibitMedia>> {
  return apiRequest<AdminExhibitMedia>(API.admin.media, {
    method: "POST",
    body: payload,
  });
}

/** Menghapus konten edukasi — DELETE /admin/content/{id} */
export async function deleteExhibitContent(
  contentId: number
): Promise<ApiResult<{ message: string }>> {
  return apiRequest<{ message: string }>(
    API.admin.contentById(String(contentId)),
    { method: "DELETE" }
  );
}

/** Menghapus media — DELETE /admin/media/{id} */
export async function deleteExhibitMedia(
  mediaId: number
): Promise<ApiResult<{ message: string }>> {
  return apiRequest<{ message: string }>(
    API.admin.mediaById(String(mediaId)),
    { method: "DELETE" }
  );
}



export async function getAdminQuizzes(): Promise<ApiResult<AdminQuiz[]>> {
  return apiRequest<AdminQuiz[]>(API.admin.quizzes);
}

/** Mengambil detail kuis tunggal — GET /admin/quizzes/{id} */
export async function getAdminQuizDetail(quizId: number): Promise<ApiResult<AdminQuiz>> {
  return apiRequest<AdminQuiz>(`${API.admin.quizzes}/${quizId}`);
}

/** Membuat kuis baru — POST /admin/quizzes */
export async function createAdminQuiz(payload: {
  title: string;
  quizType: "PRE_ZOO" | "POST_ZOO" | "RETENTION_1W" | "RETENTION_1M";
  scope: "GLOBAL" | "EXHIBIT";
  ageCategory: "CHILD" | "TEEN" | "ADULT";
  exhibitId: number | null;
  questions: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: "A" | "B" | "C" | "D";
    points: number;
  }[];
}): Promise<ApiResult<AdminQuiz>> {
  return apiRequest<AdminQuiz>(API.admin.quizzes, {
    method: "POST",
    body: payload,
  });
}

/** Memperbarui kuis — PUT /admin/quizzes/{id} */
export async function updateAdminQuiz(
  quizId: number,
  payload: {
    title: string;
    quizType: "PRE_ZOO" | "POST_ZOO" | "RETENTION_1W" | "RETENTION_1M";
    scope: "GLOBAL" | "EXHIBIT";
    ageCategory: "CHILD" | "TEEN" | "ADULT";
    exhibitId: number | null;
    questions: {
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: "A" | "B" | "C" | "D";
      points: number;
    }[];
  }
): Promise<ApiResult<{ quizId: number; totalQuestionsUpdated: number }>> {
  return apiRequest<{ quizId: number; totalQuestionsUpdated: number }>(
    API.admin.quizById(String(quizId)),
    {
      method: "PUT",
      body: payload,
    }
  );
}

/** Menghapus kuis — DELETE /admin/quizzes/{id} */
export async function deleteAdminQuiz(
  quizId: number
): Promise<ApiResult<{ message: string }>> {
  return apiRequest<{ message: string }>(
    API.admin.quizById(String(quizId)),
    { method: "DELETE" }
  );
}


/** Mengambil semua game lab untuk suatu kandang — GET /admin/lab-games?exhibit_id={exhibitId} */
export async function getLabGames(exhibitId: number): Promise<ApiResult<AdminLabGame[]>> {
  return apiRequest<AdminLabGame[]>(`${API.admin.labGames}?exhibit_id=${exhibitId}`);
}

/** Mengambil detail game lab tunggal — GET /admin/lab-games/{id} */
export async function getLabGameDetail(gameId: number): Promise<ApiResult<AdminLabGame>> {
  return apiRequest<AdminLabGame>(API.admin.labGameById(gameId));
}

/** Membuat game lab baru — POST /admin/lab-games */
export async function createLabGame(payload: {
  exhibitId: number;
  ageCategory: "CHILD" | "TEEN" | "ADULT" | "ALL";
  gameType: "DRAG_DROP" | "MATCHING" | "PICTURE_CHOICE";
  title: string;
  gameConfig: any;
}): Promise<ApiResult<AdminLabGame>> {
  return apiRequest<AdminLabGame>(API.admin.labGames, {
    method: "POST",
    body: payload,
  });
}

/** Memperbarui game lab — PUT /admin/lab-games/{id} */
export async function updateLabGame(
  gameId: number,
  payload: Partial<Omit<AdminLabGame, "id" | "createdAt" | "updatedAt">>
): Promise<ApiResult<AdminLabGame>> {
  return apiRequest<AdminLabGame>(API.admin.labGameById(gameId), {
    method: "PUT",
    body: payload,
  });
}

/** Menghapus game lab — DELETE /admin/lab-games/{id} */
export async function deleteLabGame(
  gameId: number
): Promise<ApiResult<{ id: number }>> {
  return apiRequest<{ id: number }>(API.admin.labGameById(gameId), {
    method: "DELETE",
  });
}



