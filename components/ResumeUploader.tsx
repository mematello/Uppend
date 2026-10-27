"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Resume } from '../lib/types';
import { Upload } from 'lucide-react';
import { Field } from './ui/Field';
import { Alert } from './ui/Alert';
import { SettingsRow, SettingsFooter, SettingsSaveButton } from './settings/SettingsLayout';
import { getDropzoneState } from '../lib/utils/dropzone-state';

interface ResumeUploaderProps {
  onSuccess: (resume: Resume, wasSetAsCurrent: boolean) => void;
  forceIsCurrent?: boolean;
  layout?: 'stacked' | 'rows';
}

export default function ResumeUploader({
  onSuccess,
  forceIsCurrent = false,
  layout = 'stacked',
}: ResumeUploaderProps) {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [isCurrentResume, setIsCurrentResume] = useState(forceIsCurrent);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadWarning, setUploadWarning] = useState("");

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile || !versionLabel) return;
    setIsUploading(true);
    setUploadError("");
    setUploadWarning("");

    const formData = new FormData();
    formData.append('file', resumeFile);
    formData.append('version_label', versionLabel);
    // If forced, always send 'true', otherwise send the state
    const currentVal = forceIsCurrent ? true : isCurrentResume;
    formData.append('is_current', String(currentVal));

    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload resume");

      if (data.extractionFailed) {
        setUploadWarning("Upload successful, but text extraction failed. AI fit analysis will not run when using this resume.");
      } else {
        setUploadWarning("");
      }

      // Reset local state first
      setResumeFile(null);
      setVersionLabel("");
      if (!forceIsCurrent) {
        setIsCurrentResume(false);
      }
      
      // Let parent component handle the state update (e.g. prepending to list, updating existing `is_current` flags)
      onSuccess(data.data, currentVal);
      
      // We don't call router.refresh() here, the parent handles its own router.refresh or redirect
    } catch (err: unknown) {
      setUploadError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const zoneState = getDropzoneState(isDragging, !!resumeFile);

  const fileControl = (
    <label
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={() => setIsDragging(false)}
      className={`relative flex items-center gap-3.5 min-h-[76px] px-4 py-3 rounded-ledger border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[var(--ink)] ${zoneState === 'drag' ? 'border-solid border-ink bg-accent text-on-accent' : zoneState === 'selected' ? 'border-solid border-ink bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]' : 'border-dashed border-field-border bg-card hover:bg-row-hover'}`}
    >
      <Upload className={`w-6 h-6 shrink-0 ${zoneState === 'drag' ? 'text-on-accent' : 'text-ink'}`} strokeWidth={1.5} aria-hidden="true" />
      <span className="block flex-1 min-w-0">
        <span className={`block font-medium break-words ${zoneState === 'drag' ? 'text-on-accent' : 'text-ink'}`}>
          {zoneState === 'drag' ? (resumeFile ? 'Drop to replace' : 'Drop to upload') : (resumeFile ? resumeFile.name : 'Choose a PDF or DOCX')}
        </span>
        <span className={`block text-sm ${zoneState === 'drag' ? 'text-on-accent' : 'text-muted-ink'}`}>
          {zoneState === 'drag' ? 'Release to select this file.' : (resumeFile ? 'Selected. Click to replace.' : 'Drop it here or browse. Max 5 MB.')}
        </span>
      </span>
      <span className={`shrink-0 px-3 py-1.5 rounded-ledger border font-label text-xs uppercase tracking-wider ${zoneState === 'drag' ? 'border-on-accent text-on-accent' : 'border-field-border text-ink'}`}>
        Browse
      </span>
      <input id="resume-file" type="file" accept=".pdf,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} required className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
    </label>
  );

  const versionControl = (
    <Field variant="input" id="resume-version" type="text" placeholder="e.g. Frontend Dev 2026" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} required />
  );

  const defaultControl = !forceIsCurrent && (
    <Field variant="toggle" id="is_current_resume" label="Set as current default" checked={isCurrentResume} onChange={(e) => setIsCurrentResume(e.target.checked)} />
  );

  const submitLabel = isUploading ? "Uploading..." : "Upload resume";
  const submitDisabled = isUploading || !resumeFile || !versionLabel;

  const submitButton = (
    <SettingsSaveButton type="submit" disabled={submitDisabled}>
      {submitLabel}
    </SettingsSaveButton>
  );

  return (
    <form onSubmit={handleUploadResume} className={layout === 'stacked' ? "w-full space-y-4" : undefined}>
      {layout === 'rows' ? (
        <>
          <SettingsRow htmlFor="resume-file" label="File" hint="PDF or DOCX, max 5 MB.">
            <div className="max-w-[520px]">{fileControl}</div>
          </SettingsRow>
          <SettingsRow htmlFor="resume-version" label="Version label">
            <div className="max-w-[400px]">{versionControl}</div>
          </SettingsRow>
          {!forceIsCurrent && (
            <SettingsRow label="Default" hint="Used for AI fit analysis.">
              <div className="max-w-[400px]">{defaultControl}</div>
            </SettingsRow>
          )}
          {uploadWarning && <Alert className="mt-3">{uploadWarning}</Alert>}
          <SettingsFooter status={uploadError} isError={!!uploadError}>
            {submitButton}
          </SettingsFooter>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="resume-file" className="block font-medium text-ink mb-1">
              File (PDF or DOCX, max 5MB)
            </label>
            {fileControl}
          </div>
          <div>
            <label htmlFor="resume-version" className="block font-medium text-ink mb-1">
              Version label
            </label>
            {versionControl}
          </div>
          {!forceIsCurrent && defaultControl}
          {submitButton}
          {uploadError && <p role="status" className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>}
          {uploadWarning && <Alert>{uploadWarning}</Alert>}
        </>
      )}
    </form>
  );
}

