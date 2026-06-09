export interface VisitSession {
  id: number;
  userId: number;
  visitDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  isCompleted: boolean;
  eisScore?: number | null;
  preScore?: number | null;
  postScore?: number | null;
  totalExhibitsVisited?: number | null;
}
