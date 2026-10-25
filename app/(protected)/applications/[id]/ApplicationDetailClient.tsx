"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase/client';
import ResumePreviewModal from '../../../../components/ResumePreviewModal';
import { createPortal } from 'react-dom';

import { ArrowLeft, Trash2 } from "lucide-react";
import { useRef } from 'react';

import { Application } from '../../../../lib/types';
import { updateApplication, deleteApplication, fetchApplicationById } from '../../../../lib/data-source';
import { normalizeTitleCase, normalizeSalaryInput } from '../../../../lib/utils/format';
import { SOURCE_OPTIONS } from '../../../../lib/constants';
import { useUnsavedChangesWarning } from '../../../../hooks/useUnsavedChangesWarning';
import UnsavedChangesModal from '../../../../components/UnsavedChangesModal';
import { Button } from '../../../../components/ui/Button';
import { Chip } from '../../../../components/ui/Chip';
import { Panel } from '../../../../components/ui/Panel';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Field } from '../../../../components/ui/Field';
import { formatMonthDay } from '../../../../lib/utils/ledger-format';

const STATUS_CHIP: Record<string, string> = {
  draft: 'chip-draft',
  applied: 'chip-applied',
  screening: 'chip-screening',
  interview: 'chip-interview',
  offer: 'chip-offer',
  rejected: 'chip-rejected',
  withdrawn: 'chip-withdrawn',
  ghosted: 'chip-ghosted',
};

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ApplicationDetailClient({ initialApplication, isLocal, appId }: { initialApplication: Application | null, isLocal?: boolean, appId?: string }) {
  const router = useRouter();
  
  const [applicationData, setApplicationData] = useState<Application | null>(initialApplication);
  const [isLoading, setIsLoading] = useState(isLocal && !initialApplication);
  
  const [isDirty, setIsDirty] = useState(false);
  const { showModal, confirmNavigation, cancelNavigation } = useUnsavedChangesWarning(isDirty);

  const [explicitOther, setExplicitOther] = useState(() => {
    if (!initialApplication?.source) return false;
    return !SOURCE_OPTIONS.some(o => o.value !== "Other" && o.value === initialApplication.source);
  });
  
  const [formData, setFormData] = useState({
    company_name: initialApplication?.company_name || "",
    role: initialApplication?.role || "",
    tech_stack: initialApplication?.tech_stack || [],
    salary_range: initialApplication?.salary_range || "",
    currency: initialApplication?.currency || "PHP",
    location: initialApplication?.location || "",
    source: initialApplication?.source || "",
    job_link: initialApplication?.job_link || "",
    recruiter_name: initialApplication?.recruiter_name || "",
    contact_info: initialApplication?.contact_info || "",
    
    status: initialApplication?.status || "draft",
    priority: initialApplication?.priority || "",
    date_applied: initialApplication?.date_applied || "",
    next_action: initialApplication?.next_action || "",
    next_action_date: initialApplication?.next_action_date || "",
    resume_version: initialApplication?.resume_version || "",
    cover_letter_sent: initialApplication?.cover_letter_sent || false,

    interview_stage: initialApplication?.interview_stage || "",
    interview_notes: initialApplication?.interview_notes || "",
    role_fit: initialApplication?.role_fit || "",
    culture_fit: initialApplication?.culture_fit || "",
    rejection_reason: initialApplication?.rejection_reason || "",
    notes: initialApplication?.notes || "",
    reminder_enabled: initialApplication?.reminder_enabled || false,
  });

  const isSavingRef = useRef(false);
  const isDeletingRef = useRef(false);

  const [techInput, setTechInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [resumes, setResumes] = useState<{ id: string, version_label: string }[]>([]);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('resumes')
        .select('id, version_label')
        .eq('user_id', user.id);
        
      if (data) {
        setResumes(data);
      }
    };
    fetchResumes();
  }, []);

  useEffect(() => {
    if (isLocal && !initialApplication && appId) {
      const loadLocalApp = async () => {
        try {
          const app = await fetchApplicationById(null, appId);
          if (app) {
            setApplicationData(app);
            if (app.source) {
              setExplicitOther(!SOURCE_OPTIONS.some(o => o.value !== "Other" && o.value === app.source));
            }
            setFormData({
              company_name: app.company_name || "",
              role: app.role || "",
              tech_stack: app.tech_stack || [],
              salary_range: app.salary_range || "",
              currency: app.currency || "PHP",
              location: app.location || "",
              source: app.source || "",
              job_link: app.job_link || "",
              recruiter_name: app.recruiter_name || "",
              contact_info: app.contact_info || "",
              status: app.status || "draft",
              priority: app.priority || "",
              date_applied: app.date_applied || "",
              next_action: app.next_action || "",
              next_action_date: app.next_action_date || "",
              resume_version: app.resume_version || "",
              cover_letter_sent: app.cover_letter_sent || false,
              interview_stage: app.interview_stage || "",
              interview_notes: app.interview_notes || "",
              role_fit: app.role_fit || "",
              culture_fit: app.culture_fit || "",
              rejection_reason: app.rejection_reason || "",
              notes: app.notes || "",
              reminder_enabled: app.reminder_enabled || false,
            });
          }
        } catch (err) {
          console.error("Failed to load local application", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadLocalApp();
    }
  }, [isLocal, initialApplication, appId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setIsDirty(true);
    setToast(null);
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTechKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = techInput.trim();
      if (val && !formData.tech_stack.includes(val)) {
        setIsDirty(true);
        setToast(null);
        setFormData(prev => ({ ...prev, tech_stack: [...prev.tech_stack, val] }));
      }
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setIsDirty(true);
    setToast(null);
    setFormData(prev => ({ ...prev, tech_stack: prev.tech_stack.filter((t: string) => t !== tech) }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsDirty(true);
    const { name, value } = e.target;
    if (name === "company_name" || name === "role") {
      setFormData(prev => ({ ...prev, [name]: normalizeTitleCase(value) }));
    }
    if (name === "salary_range") {
      setFormData(prev => ({ ...prev, [name]: normalizeSalaryInput(value) }));
    }
    if (name === "role_fit" || name === "culture_fit") {
      const num = parseInt(value);
      if (!isNaN(num)) {
        const clamped = Math.max(1, Math.min(5, num));
        setFormData(prev => ({ ...prev, [name]: String(clamped) }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationData?.id) return;
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    setToast(null);

    const payload = {
      ...formData,
      priority: formData.priority || null,
      role_fit: formData.role_fit ? parseInt(String(formData.role_fit)) : null,
      culture_fit: formData.culture_fit ? parseInt(String(formData.culture_fit)) : null,
      date_applied: formData.date_applied || null,
      next_action_date: formData.next_action_date || null,
    };

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      await updateApplication(user, applicationData.id, payload);
      
      setIsDirty(false);
      setToast({ message: "Application updated successfully!", type: 'success' });
    } catch (err: unknown) {
      setToast({ message: (err as Error).message, type: 'error' });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const [isDeleteModalMounted, setIsDeleteModalMounted] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const openDeleteModal = () => {
    setIsDeleteModalMounted(true);
    setTimeout(() => setIsDeleteModalVisible(true), 10);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setTimeout(() => setIsDeleteModalMounted(false), 200);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    if (isDeleteModalMounted) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDeleteModalMounted]);

  const executeDelete = async () => {
    if (!applicationData?.id) return;
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    setIsDeleting(true);
    closeDeleteModal();
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      await deleteApplication(user, applicationData.id);
      
      setIsDirty(false);
      router.push('/dashboard');
    } catch (err: unknown) {
      setToast({ message: (err as Error).message, type: 'error' });
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const deleteModalContent = isDeleteModalMounted ? (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim transition-opacity duration-200 ${isDeleteModalVisible ? 'opacity-100' : 'opacity-0'}`} 
      onClick={closeDeleteModal}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className={`bg-card rounded-ledger border border-hairline w-full max-w-sm p-6 flex flex-col transition-all duration-200 ${isDeleteModalVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
        onClick={e => e.stopPropagation()}
      >
        <h3 id="delete-dialog-title" className="font-display text-xl font-normal text-ink mb-2">Delete application</h3>
        <p className="text-sm text-muted-ink mb-6">Are you sure you want to delete this application? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button 
            type="button"
            variant="secondary"
            onClick={closeDeleteModal}
            className="px-4"
          >
            Cancel
          </Button>
          <button 
            type="button"
            onClick={executeDelete}
            className="min-h-[44px] px-4 rounded-ledger bg-red-700 dark:bg-red-800 text-white font-medium hover:opacity-90 transition-opacity focus-ink"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 flex justify-center text-muted-ink">Loading application details...</div>;
  }

  if (!applicationData) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 text-center py-20">
        <h2 className="font-display text-xl font-normal text-ink mb-4">Application not found</h2>
        <Link href="/dashboard" className="link-ink">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <Link
          href="/dashboard"
          className="btn-secondary rounded-ledger min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 mb-4"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>

        <PageHeader
          eyebrow="03 / APPLICATION"
          title={[formData.role, formData.company_name].filter(Boolean).join(' at ') || 'Untitled application'}
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={openDeleteModal}
              disabled={isDeleting}
              className="px-4 gap-2 inline-flex items-center text-red-700 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          }
        />


        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <aside>
            <Panel className="lg:sticky lg:top-6">
              <div className="font-display text-lg px-5 py-3.5 border-b border-hairline">
                Summary
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 lg:block lg:px-5 lg:py-4">
                <div className="lg:mb-3">
                  <dt className="font-label text-xs uppercase tracking-wider text-muted-ink">Status</dt>
                  <dd className="text-sm text-ink mt-0.5">
                    <Chip className={STATUS_CHIP[formData.status] ?? ''}>
                      {statusLabel(formData.status)}
                    </Chip>
                  </dd>
                </div>
                <div className="lg:mb-3">
                  <dt className="font-label text-xs uppercase tracking-wider text-muted-ink">Priority</dt>
                  <dd className="text-sm text-ink mt-0.5">
                    {formData.priority ? (formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)) : '—'}
                  </dd>
                </div>
                <div className="lg:mb-3">
                  <dt className="font-label text-xs uppercase tracking-wider text-muted-ink">Role fit</dt>
                  <dd className="text-sm text-ink mt-0.5">
                    {formData.role_fit ? (
                      <span className="font-display text-2xl tabular-nums">{formData.role_fit} / 5</span>
                    ) : '—'}
                  </dd>
                </div>
                <div className="lg:mb-3">
                  <dt className="font-label text-xs uppercase tracking-wider text-muted-ink">Culture fit</dt>
                  <dd className="text-sm text-ink mt-0.5">
                    {formData.culture_fit ? (
                      <span className="font-display text-2xl tabular-nums">{formData.culture_fit} / 5</span>
                    ) : '—'}
                  </dd>
                </div>
                <div className="lg:mb-3">
                  <dt className="font-label text-xs uppercase tracking-wider text-muted-ink">Next action</dt>
                  <dd className="text-sm text-ink mt-0.5">
                    <div>{formData.next_action || '—'}</div>
                    {formData.next_action_date && /^\d{4}-\d{2}-\d{2}$/.test(formData.next_action_date) && (
                      <span className="text-xs text-muted-ink block">{formatMonthDay(formData.next_action_date)}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-label text-xs uppercase tracking-wider text-muted-ink">Resume version</dt>
                  <dd className="text-sm text-ink mt-0.5">{formData.resume_version || '—'}</dd>
                </div>
              </dl>
            </Panel>
          </aside>

          <form id="application-detail-form" onSubmit={handleSave} className="space-y-6">
        
        {/* Extracted Fields */}
        <Panel>
          <div className="font-display text-lg px-5 py-3.5 border-b border-hairline">
            Extracted details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
            <div>
              <label htmlFor="company_name" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Company
              </label>
              <Field
                variant="input"
                required
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label htmlFor="role" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Role
              </label>
              <Field
                variant="input"
                required
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label htmlFor="salary_range" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Salary
              </label>
              <div className="flex gap-2">
                <Field
                  variant="select"
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  wrapperClassName="w-28 shrink-0"
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                  <option value="SGD">SGD</option>
                  <option value="JPY">JPY</option>
                  <option value="INR">INR</option>
                  <option value="AED">AED</option>
                </Field>
                <Field
                  variant="input"
                  type="text"
                  id="salary_range"
                  name="salary_range"
                  value={formData.salary_range || ''}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
            <div>
              <label htmlFor="location" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Location
              </label>
              <Field
                variant="input"
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="job_link" className="block font-label text-xs uppercase tracking-wider text-muted-ink">
                  Job Link
                </label>
                {formData.job_link && (
                  <a
                    href={formData.job_link.startsWith('http') ? formData.job_link : `https://${formData.job_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs link-ink flex items-center gap-1"
                  >
                    Open <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                  </a>
                )}
              </div>
              <Field
                variant="input"
                type="url"
                id="job_link"
                name="job_link"
                value={formData.job_link}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="source" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Source
              </label>
              <Field
                variant="select"
                id="source"
                name="source"
                value={explicitOther || (!SOURCE_OPTIONS.some(o => o.value !== "Other" && o.value === formData.source) && formData.source) ? "Other" : (SOURCE_OPTIONS.some(o => o.value !== "Other" && o.value === formData.source) ? formData.source : "")}
                onChange={(e) => {
                  setIsDirty(true);
                  const val = e.target.value;
                  if (val === "Other") {
                    setExplicitOther(true);
                    setFormData(prev => ({ ...prev, source: "" }));
                  } else {
                    setExplicitOther(false);
                    setFormData(prev => ({ ...prev, source: val }));
                  }
                }}
              >
                <option value="">Select a source...</option>
                {SOURCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Field>
              {(explicitOther || (!SOURCE_OPTIONS.some(o => o.value !== "Other" && o.value === formData.source) && formData.source)) ? (
                <Field
                  variant="input"
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  placeholder="Please specify"
                  className="mt-2"
                />
              ) : null}
            </div>
            <div>
              <label htmlFor="recruiter_name" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Recruiter Name
              </label>
              <Field
                variant="input"
                type="text"
                id="recruiter_name"
                name="recruiter_name"
                value={formData.recruiter_name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="contact_info" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Contact Info
              </label>
              <Field
                variant="input"
                type="text"
                id="contact_info"
                name="contact_info"
                value={formData.contact_info}
                onChange={handleInputChange}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Tech Stack
              </label>
              <div className="rounded-ledger border border-field-border bg-card p-2 min-h-[44px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-[var(--ink)]">
                {formData.tech_stack.map((tech: string, idx: number) => (
                  <Chip key={idx} className="border border-field-border text-ink normal-case tracking-normal gap-1">
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      aria-label={`Remove ${tech}`}
                      className="relative text-muted-ink hover:text-ink inline-flex items-center justify-center before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:min-w-[44px] before:min-h-[44px]"
                    >
                      &times;
                    </button>
                  </Chip>
                ))}
                <input
                  type="text"
                  value={techInput}
                  onChange={e => setTechInput(e.target.value)}
                  onKeyDown={handleTechKeyDown}
                  placeholder="Type and press Enter or comma..."
                  className="bg-transparent border-none outline-none flex-1 min-w-[150px] text-base sm:text-sm text-ink placeholder:text-muted-ink"
                />
              </div>
            </div>
          </div>
        </Panel>

        {/* Tracking Fields */}
        <Panel>
          <div className="font-display text-lg px-5 py-3.5 border-b border-hairline">
            Tracking details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
            <div className="min-w-0">
              <label htmlFor="status" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Status
              </label>
              <Field
                variant="select"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="ghosted">Ghosted</option>
              </Field>
            </div>
            <div className="min-w-0">
              <label htmlFor="priority" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Priority
              </label>
              <Field
                variant="select"
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Field>
            </div>
            <div className="min-w-0">
              <label htmlFor="date_applied" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Date Applied
              </label>
              <Field
                variant="input"
                type="date"
                id="date_applied"
                name="date_applied"
                value={formData.date_applied}
                onChange={handleInputChange}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="next_action" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Next Action
              </label>
              <Field
                variant="input"
                type="text"
                id="next_action"
                name="next_action"
                value={formData.next_action}
                onChange={handleInputChange}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="next_action_date" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Next Action Date
              </label>
              <Field
                variant="input"
                type="date"
                id="next_action_date"
                name="next_action_date"
                value={formData.next_action_date}
                onChange={handleInputChange}
              />
            </div>
            <div className="min-w-0">
              <label className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Reminder
              </label>
              <Field
                variant="toggle"
                label="Email me on this date"
                id="reminder_enabled"
                name="reminder_enabled"
                checked={formData.reminder_enabled}
                onChange={handleInputChange}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="resume_version" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Resume Version
              </label>
              <div className="flex gap-2">
                <Field
                  variant="input"
                  type="text"
                  id="resume_version"
                  name="resume_version"
                  value={formData.resume_version}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                {resumes.find(r => r.version_label === formData.resume_version) && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPreviewResumeId(resumes.find(r => r.version_label === formData.resume_version)!.id)}
                    className="px-4"
                  >
                    Preview
                  </Button>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <label className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Cover letter
              </label>
              <Field
                variant="toggle"
                label="Sent with this application"
                id="cover_letter_sent"
                name="cover_letter_sent"
                checked={formData.cover_letter_sent}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Panel>

        {/* Evaluation Fields */}
        <Panel>
          <div className="font-display text-lg px-5 py-3.5 border-b border-hairline">
            Evaluation and interviews
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
            <div>
              <label htmlFor="interview_stage" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Interview Stage
              </label>
              <Field
                variant="input"
                type="text"
                id="interview_stage"
                name="interview_stage"
                value={formData.interview_stage}
                onChange={handleInputChange}
                placeholder="e.g. Phone Screen, Technical, Final"
              />
            </div>
            <div>
              <label htmlFor="rejection_reason" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Rejection Reason
              </label>
              <Field
                variant="input"
                type="text"
                id="rejection_reason"
                name="rejection_reason"
                value={formData.rejection_reason}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="role_fit" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Role Fit (1-5)
              </label>
              <Field
                variant="input"
                type="number"
                min="1"
                max="5"
                id="role_fit"
                name="role_fit"
                value={formData.role_fit}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label htmlFor="culture_fit" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Culture Fit (1-5)
              </label>
              <Field
                variant="input"
                type="number"
                min="1"
                max="5"
                id="culture_fit"
                name="culture_fit"
                value={formData.culture_fit}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="interview_notes" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                Interview Notes
              </label>
              <Field
                variant="textarea"
                id="interview_notes"
                name="interview_notes"
                value={formData.interview_notes}
                onChange={handleInputChange}
                className="min-h-48 resize-y"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block font-label text-xs uppercase tracking-wider text-muted-ink mb-1">
                General Notes
              </label>
              <Field
                variant="textarea"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="min-h-48 resize-y"
              />
            </div>
          </div>
        </Panel>

          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-card border-t border-hairline pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0 max-h-16 overflow-y-auto">
            {toast && (<p role="status" className={`text-sm ${toast.type === 'success' ? 'text-ink' : 'text-red-700 dark:text-red-400'}`}>{toast.message}</p>)}
          </div>
          <Button type="submit" form="application-detail-form" variant="primary" disabled={isSaving} className="w-full sm:w-auto sm:ml-auto px-6">{isSaving ? "Saving..." : "Save changes"}</Button>
        </div>
      </div>

      <ResumePreviewModal resumeId={previewResumeId} onClose={() => setPreviewResumeId(null)} />
      <UnsavedChangesModal
        isOpen={showModal}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
      {typeof document !== "undefined" && createPortal(deleteModalContent, document.body)}
    </>
  );
}
