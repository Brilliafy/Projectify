import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Paperclip, Link as LinkIcon, Check, X, Unlink } from 'lucide-react';
import Underline from '@tiptap/extension-underline';
import clsx from 'clsx';

interface RichTextEditorProps {
  content: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  onAttach?: () => void;
  minHeight?: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  editable = true, 
  onAttach,
  minHeight = "100px"
}: RichTextEditorProps) {
  const handleDoubleSpace = (view: any, event: any) => {
    if (event.key === ' ') {
      const { state, dispatch } = view;
      const { selection, schema } = state;
      const { $from, empty } = selection;
      const linkType = schema.marks.link;

      if (!linkType) return false;

      if (empty && linkType.isInSet(state.storedMarks || $from.marks())) {
        if ($from.pos > 0) {
          const prevChar = state.doc.textBetween($from.pos - 1, $from.pos);
          if (prevChar === ' ') {
            const tr = state.tr.removeStoredMark(linkType);
            dispatch(tr);
            return false;
          }
        }
      }
    }
    return false;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm max-w-none focus:outline-none p-3 leading-relaxed dark:prose-invert min-h-[inherit]",
          editable ? "cursor-text" : "cursor-default"
        ),
        style: `min-height: ${minHeight}`,
      },
      handleKeyDown: handleDoubleSpace,
    },
  });

  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (!editor.isFocused) {
        if (content === '' || content === '<p></p>') {
          editor.commands.setContent('');
        } else {
          editor.commands.setContent(content);
        }
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
      editor.setOptions({
        editorProps: {
          attributes: {
            class: clsx(
              "prose prose-sm max-w-none focus:outline-none p-3 leading-relaxed dark:prose-invert min-h-[inherit]",
              editable ? "cursor-text" : "cursor-default"
            ),
          },
          handleKeyDown: handleDoubleSpace,
        }
      });
      if (editable) {
        // editor.commands.focus(); 
      }
    }
  }, [editable, editor]);

  const openLinkInput = () => {
    const previousUrl = editor?.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setIsLinkMode(true);
  };

  const closeLinkInput = () => {
    setIsLinkMode(false);
    setLinkUrl('');
    editor?.commands.focus();
  };

  const applyLink = () => {
    if (linkUrl.trim()) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    closeLinkInput();
  };

  const removeLink = () => {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      closeLinkInput();
  };

  if (!editor) return null;

  return (
    <div className={clsx(
      "border rounded-xl overflow-hidden transition-all duration-300",
      editable 
        ? "border-base-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 shadow-sm" 
        : "border-transparent bg-transparent"
    )}>
      {editable && (
        <div className="flex items-center gap-1 p-2 border-b border-base-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-base-content/70 flex-wrap relative min-h-[40px]">
          
          {isLinkMode ? (
             <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex items-center px-2 z-10 gap-2 animate-in fade-in slide-in-from-top-2">
                 <LinkIcon size={14} className="text-primary shrink-0" />
                 <input 
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="input input-xs input-bordered flex-1 min-w-[100px] bg-white dark:bg-slate-950"
                    placeholder="https://example.com"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            applyLink();
                        } else if (e.key === 'Escape') {
                            closeLinkInput();
                        }
                    }}
                 />
                 <button onClick={applyLink} className="btn btn-xs btn-primary btn-square" title="Apply Link"><Check size={14} /></button>
                 <button onClick={removeLink} className="btn btn-xs btn-ghost btn-square text-error hover:bg-error/10" title="Remove Link"><Unlink size={14} /></button>
                 <button onClick={closeLinkInput} className="btn btn-xs btn-ghost btn-square" title="Cancel"><X size={14} /></button>
             </div>
          ) : (
            <>
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={clsx("btn btn-xs btn-ghost btn-square rounded-lg", editor.isActive('bold') && "bg-primary/10 text-primary")} title="Bold"><Bold size={14} /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={clsx("btn btn-xs btn-ghost btn-square rounded-lg", editor.isActive('italic') && "bg-primary/10 text-primary")} title="Italic"><Italic size={14} /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={clsx("btn btn-xs btn-ghost btn-square rounded-lg", editor.isActive('underline') && "bg-primary/10 text-primary")} title="Underline"><UnderlineIcon size={14} /></button>
                <div className="w-px h-4 bg-base-200 dark:bg-slate-800 mx-1" />
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={clsx("btn btn-xs btn-ghost btn-square rounded-lg", editor.isActive('bulletList') && "bg-primary/10 text-primary")} title="Bullet List"><List size={14} /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={clsx("btn btn-xs btn-ghost btn-square rounded-lg", editor.isActive('orderedList') && "bg-primary/10 text-primary")} title="Ordered List"><ListOrdered size={14} /></button>
                
                <button 
                    type="button" 
                    onClick={openLinkInput} 
                    className={clsx("btn btn-xs btn-ghost btn-square rounded-lg", editor.isActive('link') && "bg-primary/10 text-primary")} 
                    title={editor.isActive('link') ? "Edit Link" : "Insert Link"}
                >
                    <LinkIcon size={14} />
                </button>
                
                <div className="flex-1"></div>
                {onAttach && (
                    <button type="button" onClick={onAttach} className="btn btn-xs btn-ghost gap-2 hover:text-primary rounded-lg font-bold uppercase tracking-widest text-[9px]" title="Attach Files">
                        <Paperclip size={14} />
                        <span>Attach</span>
                    </button>
                )}
            </>
          )}
        </div>
      )}
      <div 
        className="min-h-[inherit]" 
        style={{ minHeight: !editable ? 'auto' : minHeight }}
        onClick={() => { if(editable) editor?.commands.focus() }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
