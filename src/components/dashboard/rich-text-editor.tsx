"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Link.configure({
        autolink: false,
        openOnClick: false,
        linkOnPaste: true,
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-40 rounded-b-xl border border-input border-t-0 bg-background px-4 py-3 text-sm outline-none focus-visible:ring-0 dark:bg-input/20",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "<p></p>") !== current) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  const buttonClass =
    "justify-start gap-2 rounded-none border-border/70 border-b border-r px-3 first:rounded-tl-xl last:rounded-tr-xl last:border-r-0";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {placeholder ? (
          <p className="text-xs text-muted-foreground">{placeholder}</p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="flex flex-wrap border-b bg-muted/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={buttonClass}
            data-active={editor?.isActive("bold") ? "true" : "false"}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
            Bold
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={buttonClass}
            data-active={editor?.isActive("italic") ? "true" : "false"}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
            Italic
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={buttonClass}
            data-active={editor?.isActive("bulletList") ? "true" : "false"}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" />
            Bullets
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={buttonClass}
            data-active={editor?.isActive("orderedList") ? "true" : "false"}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" />
            Numbered
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={() => {
              const href = window.prompt("Enter a URL");
              if (!href) return;
              editor?.chain().focus().setLink({ href }).run();
            }}
          >
            <Link2 className="size-3.5" />
            Link
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={buttonClass}
            onClick={() => editor?.chain().focus().unsetLink().run()}
          >
            <RotateCcw className="size-3.5" />
            Clear link
          </Button>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export { RichTextEditor };
