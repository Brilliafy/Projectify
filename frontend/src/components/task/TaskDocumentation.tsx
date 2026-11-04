import React, { useState, useEffect } from 'react';
import { Edit2, Paperclip, Save } from 'lucide-react';
import type { Attachment } from '../../types';
import RichTextEditor from '../RichTextEditor';
import { FileAttachment } from './TaskAttachmentView';

interface TaskDocumentationProps {
  description?: string;
  attachments?: Attachment[];
  isAuthorized: boolean;
  onSaveDescription: (description: string) => void;
  isSaving?: boolean;
}

export const TaskDocumentation: React.FC<TaskDocumentationProps> = ({
  description = '',
  attachments = [],
  isAuthorized,
  onSaveDescription,
  isSaving = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);

  useEffect(() => {
    setTempDescription(description);
  }, [description]);

  const handleSave = () => {
    onSaveDescription(tempDescription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempDescription(description);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            Task Documentation
          </h3>
          {isAuthorized && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn btn-ghost btn-xs gap-2 opacity-40 hover:opacity-100 font-black uppercase tracking-widest text-[9px]"
            >
              <Edit2 size={12} /> Edit Documentation
            </button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary btn-xs gap-2 rounded-lg font-black uppercase tracking-widest text-[9px]"
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <Save size={12} />
                )}
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost btn-xs gap-2 rounded-lg font-black uppercase tracking-widest text-[9px]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="transition-all duration-300">
          <RichTextEditor
            content={isEditing ? tempDescription : description}
            onChange={(html) => setTempDescription(html)}
            editable={isEditing}
            minHeight={isEditing ? '300px' : 'auto'}
          />
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-base-200 dark:border-slate-800/50">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2 font-['Outfit']">
            <Paperclip size={14} /> Attachments
          </h3>
          <div className="flex flex-wrap gap-4">
            {attachments.map((att, i) => (
              <FileAttachment key={att._id || i} file={att} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDocumentation;
