"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Application } from '../../../lib/types';
import { fetchApplications, updateApplicationStatus } from '../../../lib/data-source';
import { getStreakStatus, getGoalProgress, getWeeklyCount } from '../../../lib/utils/streaks';
import { formatToLocalDate } from '../../../lib/utils/dates';
import { averageFit, formatMonthDay, fitValue, compareNullsLast } from '../../../lib/utils/ledger-format';
import ActivityHeatmapDropdown from './ActivityHeatmapDropdown';
import { Panel } from '../../../components/ui/Panel';
import { Field } from '../../../components/ui/Field';
import { Chip } from '../../../components/ui/Chip';
import { Button } from '../../../components/ui/Button';

const STATUS_COLORS: Record<string, string> = {
  draft: "chip-draft",
  applied: "chip-applied",
  screening: "chip-screening",
  interview: "chip-interview",
  offer: "chip-offer",
  rejected: "chip-rejected",
  withdrawn: "chip-withdrawn",
  ghosted: "chip-ghosted",
};

export default function DashboardClient({ initialApplications, isLocal, timezone, accountCreatedAt, dailyGoal = 5, quote }: { initialApplications: Application[], isLocal?: boolean, timezone?: string | null, accountCreatedAt?: string | null, dailyGoal?: number, quote?: { text: string; author: string } | null }) {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [filter, setFilter] = useState<string>("Active");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortAsc, setSortAsc] = useState<boolean>(false); // false = descending by default
  const [isLoading, setIsLoading] = useState<boolean>(isLocal === true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

  useEffect(() => {
    const savedPageSize = localStorage.getItem('dashboard_page_size');
    if (savedPageSize) {
      setPageSize(Number(savedPageSize));
    }
  }, []);

  useEffect(() => {
    const savedSortField = sessionStorage.getItem('dashboard_sort_field');
    if (savedSortField) setSortField(savedSortField);
    
    const savedSortAsc = sessionStorage.getItem('dashboard_sort_asc');
    if (savedSortAsc) setSortAsc(savedSortAsc === 'true');
    
    const savedCurrentPage = sessionStorage.getItem('dashboard_current_page');
    if (savedCurrentPage) setCurrentPage(Number(savedCurrentPage));
  }, []);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = Number(e.target.value);
    setPageSize(size);
    setCurrentPage(1);
    localStorage.setItem('dashboard_page_size', size.toString());
  };

  useEffect(() => {
    if (isLocal) {
      fetchApplications(null)
        .then(data => {
          setApplications(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to load local applications', err);
          setIsLoading(false);
        });
    }
  }, [isLocal]);

  const isUpdatingRef = useRef<Set<string>>(new Set());

  const handleStatusChange = async (id: string, newStatus: string, e: React.ChangeEvent) => {
    e.stopPropagation(); // prevent row click navigation when modifying status
    
    if (isUpdatingRef.current.has(id)) return;
    
    // Find old status for rollback
    const appIndex = applications.findIndex(app => app.id === id);
    if (appIndex === -1) return;
    const oldStatus = applications[appIndex].status;

    isUpdatingRef.current.add(id);

    // 1. Optimistic UI Update (immediate visual feedback)
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));

    // 2. Background API Call
    try {
      // In local mode, user is null. We simulate passing user or null to the abstraction.
      // Since this is a client component, we pass null if isLocal is true, otherwise fake a user object just to let data-source know we are authenticated (since data-source.ts just checks if user exists).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dummyUser = isLocal ? null : { id: 'auth' } as any; 
      await updateApplicationStatus(dummyUser, id, newStatus);
    } catch (err) {
      console.error(err);
      // 3. Rollback on failure!
      alert("Failed to save status update. Reverting change.");
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: oldStatus } : app));
    } finally {
      isUpdatingRef.current.delete(id);
    }
  };

  const handleRowClick = (id: string) => {
    router.push(`/applications/${id}`); // Placeholder route as requested
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      const newSortAsc = !sortAsc;
      setSortAsc(newSortAsc); // toggle
      sessionStorage.setItem('dashboard_sort_asc', String(newSortAsc));
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for new fields
      sessionStorage.setItem('dashboard_sort_field', field);
      sessionStorage.setItem('dashboard_sort_asc', 'false');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your applications...</div>;
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {isLocal && (
          <div className="w-full max-w-2xl mb-8 p-4 bg-card text-ink border border-hairline rounded-ledger text-sm text-left">
            <strong>You are in local mode.</strong> Data is saved to this device only and will be lost if you clear your browser data. <Link href="/signup" className="underline font-semibold hover:text-muted-ink">Sign up to cloud sync</Link>.
          </div>
        )}
        <h2 className="text-2xl font-bold font-display mb-4 text-ink">No applications yet</h2>
        <p className="text-muted-ink mb-8 max-w-md">
          You haven&apos;t tracked any job applications yet. Paste your first job description to get started!
        </p>
        <Link href="/new" className="px-6 py-3 btn-primary rounded-ledger font-medium">
          Track New Application
        </Link>
      </div>
    );
  }

  // Derived state: Filter (Status + Search)
  let filteredApps = applications;
  if (filter === "Active") {
    filteredApps = filteredApps.filter(a => !['rejected', 'withdrawn', 'ghosted'].includes(a.status));
  } else if (filter !== "All") {
    filteredApps = filteredApps.filter(a => a.status === filter);
  }
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filteredApps = filteredApps.filter(a => 
      (a.company_name?.toLowerCase().includes(q)) || 
      (a.role?.toLowerCase().includes(q))
    );
  }
  
  // Derived state: Sort
  const sortedApps = [...filteredApps].sort((a, b) => {
    let valA = a[sortField as keyof Application];
    let valB = b[sortField as keyof Application];

    if (sortField === 'fit') {
      const diff = compareNullsLast(
        fitValue(a.role_fit, a.culture_fit),
        fitValue(b.role_fit, b.culture_fit),
        sortAsc
      );
      if (diff !== 0) return diff;
    }

    if (sortField === 'priority') {
      const pmap: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1, 'null': 0, '': 0 };
      valA = pmap[String(valA)] || 0;
      valB = pmap[String(valB)] || 0;
    } else if (sortField === 'company_name' || sortField === 'role') {
      valA = String(valA || "").toLowerCase();
      valB = String(valB || "").toLowerCase();
    } else {
      valA = String(valA || "");
      valB = String(valB || "");
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;

    // Fallback sort
    const createA = String(a.created_at || "");
    const createB = String(b.created_at || "");
    if (createA < createB) return 1;
    if (createA > createB) return -1;
    
    return 0;
  });

  const streakInfo = getStreakStatus(applications, timezone || null);

  const goalInfo = getGoalProgress(applications, timezone || null, dailyGoal);
  const weeklyCount = getWeeklyCount(applications, timezone || null);

  const progressPct = Math.min(100, (goalInfo.count / Math.max(1, dailyGoal)) * 100);

  // Pagination
  const totalPages = Math.ceil(sortedApps.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedApps = sortedApps.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="w-4 h-4 inline-block opacity-0 group-hover:opacity-30 transition-opacity"><ChevronDown className="w-4 h-4" /></span>;
    return (
      <span className="w-4 h-4 inline-block text-ink">
        {sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </span>
    );
  };

  return (
    <div>
      {isLocal && (
        <div className="mb-6 p-4 bg-card text-ink border border-hairline rounded-ledger text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <span><strong>You are in local mode.</strong> Data is saved to this device only and will be lost if you clear your browser data.</span>
          <Link href="/signup" className="underline font-semibold hover:text-muted-ink whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center">Sign up to cloud sync</Link>
        </div>
      )}

      {/* Stats Strip */}
      <Panel className="grid grid-cols-2 lg:flex mb-6">
        {/* Cell 1: Daily Goal */}
        <div 
          className="p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b lg:border-b-0 border-r lg:border-r lg:last:border-r-0 last:border-b-0 lg:flex-1 flex flex-col gap-1 lg:gap-3"
          title={`${goalInfo.count} of ${goalInfo.goal} applications today`}
        >
          <div className="font-label text-xs uppercase tracking-wider leading-none lg:h-4 lg:leading-4 text-muted-ink">
            Today&apos;s goal
          </div>
          <div className="flex items-end min-h-0 lg:min-h-[2.5rem]">
            <span className="font-display text-2xl lg:text-3xl leading-none tabular-nums text-ink">
              {goalInfo.count}/{goalInfo.goal}
            </span>
          </div>
          <div className="hidden lg:flex min-h-[1rem] items-center">
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
              <div 
                className="h-full bg-ink transition-all duration-500 ease-out" 
                style={{ width: `${progressPct}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Cell 2: Weekly Count */}
        <div 
          className="p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b lg:border-b-0 border-r-0 lg:border-r lg:last:border-r-0 last:border-b-0 lg:flex-1 flex flex-col gap-1 lg:gap-3"
          title="Applications created this week (Mon–Sun)"
        >
          <div className="font-label text-xs uppercase tracking-wider leading-none lg:h-4 lg:leading-4 text-muted-ink">
            This week
          </div>
          <div className="flex items-end min-h-0 lg:min-h-[2.5rem]">
            <span className="font-display text-2xl lg:text-3xl leading-none tabular-nums text-ink">
              {weeklyCount}
            </span>
          </div>
          <div className="hidden lg:block min-h-[1rem]" />
        </div>

        {/* Cell 3: Streak */}
        {streakInfo.status !== 'none' && (
          <div 
            className={`relative col-span-2 lg:col-span-1 p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b lg:border-b-0 border-r-0 lg:border-r lg:last:border-r-0 last:border-b-0 lg:flex-[1.4] transition-colors ${
              streakInfo.status === 'active'
                ? 'bg-accent text-on-accent'
                : 'bg-card text-ink'
            }`}
          >
            <button 
              type="button"
              onClick={() => setIsHeatmapOpen(!isHeatmapOpen)}
              className="w-full h-full flex flex-row flex-wrap items-center content-center gap-x-3 gap-y-1 lg:items-baseline lg:flex-col lg:gap-3 text-left min-h-[44px]"
            >
              <div className={`font-label text-xs uppercase tracking-wider leading-none lg:h-4 lg:leading-4 ${streakInfo.status === 'active' ? 'text-on-accent' : 'text-muted-ink'}`}>
                Streak
              </div>
              <div className="flex items-center lg:items-end min-h-0 lg:min-h-[2.5rem]">
                <span className={`font-display text-2xl lg:text-3xl leading-none tabular-nums ${streakInfo.status === 'active' ? 'text-on-accent' : 'text-ink'}`}>
                  {streakInfo.count} {streakInfo.count === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="basis-full lg:basis-auto min-h-0 lg:min-h-[1rem] flex items-center">
                {streakInfo.status === 'at_risk' && (
                  <span className="font-label text-xs normal-case tracking-normal text-ink">
                    apply today to keep it!
                  </span>
                )}
              </div>
            </button>
            
            {isHeatmapOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsHeatmapOpen(false)}></div>
                <div className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 bg-card rounded-ledger border border-hairline z-20 overflow-hidden transform origin-top-right sm:origin-top-left transition-all">
                  <ActivityHeatmapDropdown
                    applications={applications}
                    accountCreatedAt={accountCreatedAt || null}
                    timezone={timezone || null}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Cell 4: Quote of the Day */}
        {quote && (
          <div className="col-span-2 lg:col-span-1 p-3 lg:p-5 min-h-0 lg:min-h-[120px] border-hairline border-b last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:flex-[2] flex flex-col gap-1 lg:gap-3 min-w-0">
            <div className="font-label text-xs uppercase tracking-wider leading-none lg:h-4 lg:leading-4 text-muted-ink">
              Quote of the day
            </div>
            <div className="flex items-start min-h-0 lg:min-h-[2.5rem] min-w-0">
              <div 
                className="font-display italic text-sm lg:text-base text-ink break-words min-w-0"
                title={`"${quote.text}"${quote.author ? ` — ${quote.author}` : ''}`}
              >
                &quot;{quote.text}&quot;{quote.author ? ` — ${quote.author}` : ''}
              </div>
            </div>
            <div className="hidden lg:block min-h-[1rem]" />
          </div>
        )}
      </Panel>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 items-start sm:items-center">
          <div className="w-full sm:w-72">
            <Field
              variant="input"
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap pb-2 md:pb-0 w-full md:w-auto items-center">
          {['Active', 'All'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 min-h-[44px] rounded-ledger text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {status}
            </button>
          ))}
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className={`appearance-none pl-4 pr-10 py-1.5 min-h-[44px] rounded-ledger text-sm font-medium whitespace-nowrap transition-colors cursor-pointer focus-ink ${
                !['Active', 'All'].includes(filter) 
                  ? 'btn-primary' 
                  : 'btn-secondary'
              }`}
            >
              {['Active', 'All'].includes(filter) ? "Filter by status" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''} ${!['Active', 'All'].includes(filter) ? 'text-[var(--paper)]' : 'text-[var(--muted)]'}`} />
              </div>
            </button>
            
            {isStatusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-ledger border border-hairline z-20 overflow-hidden transform origin-top-right transition-all">
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-xs font-label font-semibold text-muted-ink uppercase tracking-wider">
                      Filter by status
                    </div>
                    {['draft', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setFilter(status);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 min-h-[44px] rounded-ledger text-sm transition-colors ${
                          filter === status ? 'bg-[var(--accent)] text-[var(--on-accent)] font-semibold' : 'text-[var(--ink)] hover:bg-[var(--row-hover)]'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <Panel className="overflow-hidden md:overflow-x-auto mb-8">
        <table className="w-full text-left border-collapse block md:table min-w-full md:min-w-[800px]">
          <thead className="bg-paper border-b border-hairline hidden md:table-header-group">
            <tr>
              <th 
                className="px-4 py-3 font-label uppercase text-xs tracking-wider text-muted-ink cursor-pointer hover:text-ink select-none transition-colors group whitespace-nowrap border-b border-hairline"
                onClick={() => handleSort('company_name')}
              >
                <div className="flex items-center gap-1">Company <SortIcon field="company_name" /></div>
              </th>
              <th 
                className="px-4 py-3 font-label uppercase text-xs tracking-wider text-muted-ink cursor-pointer hover:text-ink select-none transition-colors group whitespace-nowrap border-b border-hairline"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-1">Role <SortIcon field="role" /></div>
              </th>
              <th className="px-4 py-3 font-label uppercase text-xs tracking-wider text-muted-ink whitespace-nowrap border-b border-hairline">Status</th>
              <th 
                className="px-4 py-3 font-label uppercase text-xs tracking-wider text-muted-ink cursor-pointer hover:text-ink select-none transition-colors group whitespace-nowrap border-b border-hairline"
                onClick={() => handleSort('date_applied')}
              >
                <div className="flex items-center gap-1">Applied <SortIcon field="date_applied" /></div>
              </th>
              <th 
                className="px-4 py-3 font-label uppercase text-xs tracking-wider text-muted-ink cursor-pointer hover:text-ink select-none transition-colors group whitespace-nowrap border-b border-hairline"
                onClick={() => handleSort('fit')}
              >
                <div className="flex items-center gap-1">Fit <SortIcon field="fit" /></div>
              </th>
              <th 
                className="px-4 py-3 font-label uppercase text-xs tracking-wider text-muted-ink cursor-pointer hover:text-ink select-none transition-colors group whitespace-nowrap border-b border-hairline"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">Priority <SortIcon field="priority" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group divide-y divide-hairline">
            {paginatedApps.map(app => (
              <tr 
                key={app.id} 
                onClick={() => handleRowClick(app.id)}
                className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 md:table-row p-4 md:p-0 border-b md:border-b-0 border-hairline last:border-0 hover:bg-row-hover transition-colors duration-150 cursor-pointer group"
              >
                <td className="col-span-2 col-start-1 row-start-1 font-display text-lg leading-tight text-ink md:font-sans md:text-sm md:font-medium md:p-4 md:table-cell">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="min-w-0 md:max-w-[12rem] md:truncate" title={app.company_name}>
                      {app.company_name}
                    </span>
                    {app.job_link && (
                      <a 
                        href={app.job_link.startsWith('http') ? app.job_link : `https://${app.job_link}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="-my-2 md:my-0 text-muted-ink hover:text-ink opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 shrink-0"
                        title="View job posting"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="col-span-3 row-start-2 text-sm text-muted-ink md:p-4 md:table-cell">
                  {app.role}
                </td>
                <td className="col-start-3 row-start-1 justify-self-end md:p-4 md:table-cell">
                  <Chip className={`${STATUS_COLORS[app.status]} -my-2 md:my-0 px-0 py-0`}>
                    <Field
                      variant="select"
                      tone="chip"
                      className="min-h-[44px] md:min-h-0 py-2 md:py-1"
                      value={app.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(app.id, e.target.value, e)}
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
                  </Chip>
                </td>
                <td 
                  className="col-start-1 row-start-3 text-muted-ink font-mono tabular-nums uppercase text-sm md:text-sm md:p-4 md:table-cell"
                  title={app.date_applied ?? undefined}
                >
                  <span className="md:hidden font-label text-xs uppercase tracking-wider text-muted-ink mr-2">Applied</span>
                  {formatMonthDay(app.date_applied)}
                </td>
                <td className="col-start-3 row-start-3 justify-self-end text-muted-ink font-mono tabular-nums text-sm md:text-sm md:p-4 md:table-cell">
                  <span className="md:hidden font-label text-xs uppercase tracking-wider text-muted-ink mr-2">Fit</span>
                  {averageFit(app.role_fit, app.culture_fit)}
                </td>
                <td className="col-start-2 row-start-3 md:p-4 md:table-cell">
                  <div className="flex items-center">
                    {app.priority ? (
                      <span className={`bg-transparent font-label text-xs uppercase tracking-wider px-2 py-0.5 rounded-ledger inline-flex ${
                        app.priority === 'high' ? 'border border-ink text-ink font-semibold' :
                        app.priority === 'medium' ? 'border border-field-border text-ink' :
                        'border border-hairline text-muted-ink'
                      }`}>
                        {app.priority.toUpperCase()}
                      </span>
                    ) : (
                      <span className="hidden md:inline text-muted-ink">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sortedApps.length === 0 && (
              <tr className="block md:table-row">
                <td colSpan={6} className="p-12 text-center text-muted-ink block md:table-cell">
                  {searchQuery ? "No applications found matching your search and filter." : "No applications match the current filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {sortedApps.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-t border-hairline bg-card">
            <div className="flex items-center gap-2">
              <span className="font-label text-xs uppercase tracking-wider text-muted-ink">Rows per page:</span>
              <Field
                variant="select"
                wrapperClassName="w-auto"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Field>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-ink">
              <span className="font-mono tabular-nums">Page {safeCurrentPage} of {totalPages}</span>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => {
                    const newPage = Math.max(1, p - 1);
                    sessionStorage.setItem('dashboard_current_page', String(newPage));
                    return newPage;
                  })}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => {
                    const newPage = Math.min(totalPages, p + 1);
                    sessionStorage.setItem('dashboard_current_page', String(newPage));
                    return newPage;
                  })}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-1 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Panel>

    </div>
  );
}
