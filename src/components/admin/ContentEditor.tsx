// src/components/admin/ContentEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AdminLearningContent } from "@/types/admin.types";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/cn";

interface ContentEditorProps {
  ageCategory: "CHILD" | "TEEN" | "ADULT";
  existingContent: AdminLearningContent | undefined;
  onSave: (title: string, body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  isSaving: boolean;
  isDeleting: boolean;
  onAddModeTrigger?: () => void;
}

export default function ContentEditor({
  ageCategory,
  existingContent,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  onAddModeTrigger,
}: ContentEditorProps) {
  // Form states
  const [form, setForm] = useState({
    title: "",
    body: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: form.body,
    onUpdate: ({ editor }) => {
      const htmlValue = editor.getHTML();
      setForm((prev) => ({ ...prev, body: htmlValue }));
      if (errors.body) {
        setErrors((prev) => ({ ...prev, body: "" }));
      }
    },
    onFocus: () => {
      setIsFocused(true);
    },
    onBlur: () => {
      setIsFocused(false);
    },
    editorProps: {
      attributes: {
        class: cn(
          "w-full min-h-[200px] px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none rich-text-content max-w-none"
        ),
      },
    },
  });

  // Synchronize form with existing content
  useEffect(() => {
    if (existingContent) {
      setForm({
        title: existingContent.contentTitle,
        body: existingContent.contentBody,
      });
      setIsEditing(false);
    } else {
      setForm({ title: "", body: "" });
      setIsEditing(false);
    }
    setErrors({});
  }, [existingContent, ageCategory]);

  // Synchronize Tiptap editor content when existingContent or ageCategory changes
  useEffect(() => {
    if (editor) {
      if (existingContent) {
        const currentHTML = editor.getHTML();
        if (currentHTML !== existingContent.contentBody) {
          editor.commands.setContent(existingContent.contentBody);
        }
      } else {
        editor.commands.clearContent();
      }
    }
  }, [existingContent, ageCategory, editor]);

  // Handler for text inputs
  function handleChange(field: "title" | "body") {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };
  }

  // Validate form locally before submit
  function validateForm() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) {
      errs.title = "Judul konten wajib diisi";
    } else if (form.title.trim().length < 5) {
      errs.title = "Judul minimal 5 karakter";
    }

    const textContent = editor ? editor.getText() : form.body;
    if (!textContent.trim()) {
      errs.body = "Isi konten wajib diisi";
    } else if (textContent.trim().length < 10) {
      errs.body = "Isi konten minimal 10 karakter";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await onSave(form.title.trim(), form.body.trim());
    if (success) {
      setIsEditing(false);
    }
  }

  const categoryName = {
    CHILD: "Anak-anak (Child)",
    TEEN: "Remaja (Teen)",
    ADULT: "Dewasa (Adult)",
  }[ageCategory];

  if (!editor) {
    return null;
  }

  // If no content exists and we are not in edit mode, show empty state
  if (!existingContent && !isEditing) {
    return (
      <div className="text-center py-8 text-on-surface-variant flex flex-col items-center justify-center">
        <span
          className="material-symbols-outlined text-4xl mb-2 text-outline-variant"
          style={{ fontSize: "48px" }}
        >
          post_add
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">
          Belum ada materi edukasi untuk kategori {categoryName.toLowerCase()}.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsEditing(true);
            onAddModeTrigger?.();
          }}
          className="font-label-md text-label-md text-primary hover:underline decoration-2 underline-offset-4 cursor-pointer"
        >
          Tambah Materi Sekarang
        </button>
      </div>
    );
  }

  const toolbarButtons = [
    {
      icon: "format_bold",
      label: "Tebal",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: "format_italic",
      label: "Miring",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: "title",
      label: "Judul Besar (H3)",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
    {
      icon: "format_list_bulleted",
      label: "Daftar Bullet",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      icon: "format_list_numbered",
      label: "Daftar Angka",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Title input */}
      <Input
        label="Judul Konten"
        value={form.title}
        onChange={handleChange("title")}
        error={errors.title}
        placeholder="Masukkan judul materi edukasi"
        required
      />

      {/* Tiptap Rich Text Editor */}
      <div className="flex flex-col gap-1 w-full">
        <label className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-on-surface-variant ml-1">
          Isi Konten
          <span className="ml-1 text-error">*</span>
        </label>
        <div className={cn(
          "flex flex-col rounded-xl border bg-surface-container-lowest transition-all duration-150 overflow-hidden",
          errors.body 
            ? "border-error ring-1 ring-error" 
            : isFocused 
              ? "border-primary ring-1 ring-primary" 
              : "border-outline-variant"
        )}>
          {/* Toolbar baris atas */}
          <div className="flex flex-wrap gap-1 p-2 bg-surface-container-low border-b border-outline-variant">
            {toolbarButtons.map((btn, index) => (
              <button
                key={index}
                type="button"
                onClick={btn.action}
                title={btn.label}
                className={cn(
                  "p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-150 cursor-pointer flex items-center justify-center min-w-9 min-h-9",
                  btn.isActive && "bg-primary/10 text-primary font-bold"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
              </button>
            ))}
          </div>
          {/* Area Editor */}
          <div className="p-1">
            <EditorContent editor={editor} />
          </div>
        </div>
        {errors.body && (
          <span className="text-error text-xs ml-1 mt-0.5 fade-in-up">
            {errors.body}
          </span>
        )}
      </div>

      {/* Actions & Timestamps */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-outline-variant/30">
        <span className="text-label-sm font-label-sm text-outline">
          {existingContent?.updatedAt
            ? `Terakhir diubah: ${new Date(existingContent.updatedAt).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Materi baru (belum disimpan)"}
        </span>
        <div className="flex items-center gap-3 justify-end">
          {existingContent && (
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              disabled={isSaving}
              onClick={onDelete}
              className="px-5 py-2"
            >
              Hapus Konten
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            disabled={isDeleting}
            className="px-6 py-2"
          >
            Simpan
          </Button>
        </div>
      </div>
    </form>
  );
}

