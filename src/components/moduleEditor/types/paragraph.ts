// 📁 types/paragraph.ts

// ✅ ParagraphBlock과 완전히 호환되는 LocalParagraph 타입 정의
export interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string; // ✅ 원본 단락 ID 추적용 (ParagraphBlock과 동일)
}
