import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  ShieldCheck, 
  Star, 
  AlertCircle, 
  Layers,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { jobsApi, companyJobsApi } from '../services/api';
import type { 
  JobCategory, 
  CreateJobRequirementDto
} from '../types/recruitment';
import { PageTransition } from '../components/common/PageTransition';

export const CreateEditJob: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user, activeCompanyId } = useAuth();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [jobCategoryId, setJobCategoryId] = useState<number>(1);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [employmentType, setEmploymentType] = useState<number>(0); // FullTime
  const [workplaceType, setWorkplaceType] = useState<number>(0); // OnSite
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(1);
  const [currentStatus, setCurrentStatus] = useState<any>(0);

  // Structured Requirements
  const [requirements, setRequirements] = useState<CreateJobRequirementDto[]>([]);
  
  // New requirement inputs
  const [newReqText, setNewReqText] = useState('');
  const [newReqCategory, setNewReqCategory] = useState<number>(0); // Skill
  const [newReqType, setNewReqType] = useState<number>(0); // Mandatory

  useEffect(() => {
    const resolvedId = activeCompanyId || (user?.companies && user.companies.length > 0 ? user.companies[0].companyId : null);
    if (resolvedId) {
      setCompanyId(resolvedId);
    }
  }, [activeCompanyId, user]);

  useEffect(() => {
    loadInitialData();
  }, [companyId, id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const cats = await jobsApi.getCategories();
      setCategories(cats);
      if (cats.length > 0 && !isEditing) {
        setJobCategoryId(cats[0].id);
      }

      if (isEditing && companyId && id) {
        const existing = await companyJobsApi.getJob(companyId, id);
        setTitle(existing.title);
        setJobCategoryId(existing.jobCategoryId);
        setSummary(existing.summary);
        setDescription(existing.description);
        setResponsibilities(existing.responsibilities);
        setEmploymentType(typeof existing.employmentType === 'number' ? existing.employmentType : 0);
        setWorkplaceType(typeof existing.workplaceType === 'number' ? existing.workplaceType : 0);
        setLocation(existing.location);
        setSalaryMin(existing.salaryMin != null ? String(existing.salaryMin) : '');
        setSalaryMax(existing.salaryMax != null ? String(existing.salaryMax) : '');
        setSalaryCurrency(existing.salaryCurrency || 'USD');
        setActiveVersionNumber(existing.activeVersionNumber || 1);
        setCurrentStatus(existing.status);
        if (existing.expiresAtUtc) {
          setExpiresAt(existing.expiresAtUtc.split('T')[0]);
        }
        if (existing.requirements) {
          setRequirements(existing.requirements.map((r, idx) => ({
            requirementText: r.requirementText,
            requirementCategory: typeof r.requirementCategory === 'number' ? r.requirementCategory : 0,
            requirementType: typeof r.requirementType === 'number' ? r.requirementType : 0,
            displayOrder: idx + 1,
          })));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load vacancy data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqText.trim()) return;

    const newReq: CreateJobRequirementDto = {
      requirementText: newReqText.trim(),
      requirementCategory: newReqCategory,
      requirementType: newReqType,
      displayOrder: requirements.length + 1,
    };

    setRequirements([...requirements, newReq]);
    setNewReqText('');
  };

  const handleRemoveRequirement = (idx: number) => {
    const updated = requirements.filter((_, i) => i !== idx).map((req, i) => ({
      ...req,
      displayOrder: i + 1,
    }));
    setRequirements(updated);
  };

  const handleMoveRequirement = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= requirements.length) return;

    const copy = [...requirements];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((req, i) => ({
      ...req,
      displayOrder: i + 1,
    }));
    setRequirements(reordered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (!title.trim() || !summary.trim() || !description.trim() || !location.trim()) {
      setError('Please fill in all mandatory job specification fields.');
      return;
    }

    if (requirements.length === 0) {
      setError('At least one structured requirement (skill, qualification, or experience) is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      jobCategoryId,
      title: title.trim(),
      summary: summary.trim(),
      description: description.trim(),
      responsibilities: responsibilities.trim() || undefined,
      employmentType: Number(employmentType),
      workplaceType: Number(workplaceType),
      location: location.trim(),
      salaryMin: salaryMin ? parseFloat(salaryMin) : undefined,
      salaryMax: salaryMax ? parseFloat(salaryMax) : undefined,
      salaryCurrency: salaryCurrency.trim().toUpperCase(),
      expiresAtUtc: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      requirements: requirements.map((r, i) => ({
        requirementText: r.requirementText,
        requirementCategory: Number(r.requirementCategory),
        requirementType: Number(r.requirementType),
        displayOrder: i + 1,
      })),
    };

    try {
      if (isEditing && id) {
        await companyJobsApi.updateJob(companyId, id, payload);
      } else {
        await companyJobsApi.createJob(companyId, payload);
      }
      navigate('/company/jobs');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Failed to save vacancy.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: any) => {
    const map: Record<string, string> = {
      '0': 'Technical Skill',
      '1': 'Professional Experience',
      '2': 'Education',
      '3': 'Certification',
      'Skill': 'Technical Skill',
      'Experience': 'Professional Experience',
      'Education': 'Education',
      'Certification': 'Certification',
    };
    return map[String(cat)] || 'Skill';
  };

  if (loading) {
    return (
      <div className="portal-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading vacancy editor...</p>
      </div>
    );
  }

  const isPublished = String(currentStatus) === '1' || String(currentStatus) === 'Published';

  return (
    <PageTransition>
      <div className="portal-container" style={{ maxWidth: '960px', padding: '2rem 1.5rem 5rem' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/company/jobs" className="link-subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Vacancies
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          {isEditing ? 'Edit Job Opening' : 'Create New Job Opening'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Define role specifications, transparent compensation, and structured evaluation criteria.
        </p>
      </div>

      {isEditing && isPublished && (
        <div className="info-banner" style={{ marginBottom: '1.75rem' }}>
          <Layers size={20} />
          <div>
            <strong>Published Vacancy Versioning Active (Current: v{activeVersionNumber})</strong>
            <p style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
              Updating this published vacancy will create a new immutable version snapshot (v{activeVersionNumber + 1}). All previously submitted applications remain anchored to their original snapshot version.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.75rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Validation Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div className="card-form" style={{ marginBottom: '2rem' }}>
          <div className="form-section">
            <h3>1. Role Specifications</h3>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="title">Job Title *</label>
            <input
              id="title"
              type="text"
              className="input-standard"
              placeholder="e.g. Senior Full-Stack Engineer (.NET & React)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                className="select-standard"
                value={jobCategoryId}
                onChange={(e) => setJobCategoryId(parseInt(e.target.value, 10))}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Primary Location / Region *</label>
              <input
                id="location"
                type="text"
                className="input-standard"
                placeholder="e.g. London, UK or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="workplaceType">Workplace Arrangement *</label>
              <select
                id="workplaceType"
                className="select-standard"
                value={workplaceType}
                onChange={(e) => setWorkplaceType(parseInt(e.target.value, 10))}
              >
                <option value={0}>On-Site (Physical Office)</option>
                <option value={1}>Hybrid (Office & Remote)</option>
                <option value={2}>Remote (Anywhere / Distributed)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="employmentType">Employment Type *</label>
              <select
                id="employmentType"
                className="select-standard"
                value={employmentType}
                onChange={(e) => setEmploymentType(parseInt(e.target.value, 10))}
              >
                <option value={0}>Full-Time</option>
                <option value={1}>Part-Time</option>
                <option value={2}>Contract</option>
                <option value={3}>Internship</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="summary">Executive Summary *</label>
            <textarea
              id="summary"
              rows={2}
              className="textarea-standard"
              placeholder="High-level 2-sentence summary visible in marketplace search cards..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              maxLength={500}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="description">Full Description & Context *</label>
            <textarea
              id="description"
              rows={5}
              className="textarea-standard"
              placeholder="Comprehensive details about the team, culture, and day-to-day work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="responsibilities">Key Responsibilities</label>
            <textarea
              id="responsibilities"
              rows={4}
              className="textarea-standard"
              placeholder="List core day-to-day deliverables and expectations..."
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Compensation & Schedule */}
        <div className="card-form" style={{ marginBottom: '2rem' }}>
          <div className="form-section">
            <h3>2. Compensation & Application Window</h3>
          </div>

          <div className="form-row" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="salaryMin">Minimum Compensation</label>
              <input
                id="salaryMin"
                type="number"
                min="0"
                step="500"
                className="input-standard"
                placeholder="e.g. 80000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="salaryMax">Maximum Compensation</label>
              <input
                id="salaryMax"
                type="number"
                min="0"
                step="500"
                className="input-standard"
                placeholder="e.g. 110000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currency">Currency Code</label>
              <input
                id="currency"
                type="text"
                maxLength={3}
                className="input-standard"
                placeholder="USD"
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiresAt">Application Deadline (Optional)</label>
              <input
                id="expiresAt"
                type="date"
                className="input-standard"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Structured Requirements Builder */}
        <div className="card-form" style={{ marginBottom: '2.5rem' }}>
          <div className="form-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Sparkles size={18} className="text-primary" />
              <h3 style={{ margin: 0 }}>3. Structured Qualification Requirements *</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Define concrete skills, education, and credentials. These criteria form the basis of candidate qualification and matching.
            </p>
          </div>

          {/* Add requirement sub-form */}
          <div style={{ 
            backgroundColor: 'var(--bg-input)', 
            padding: '1.25rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Requirement Description
                </label>
                <input
                  type="text"
                  className="input-standard"
                  placeholder="e.g. 5+ years of C# / .NET architecture experience"
                  value={newReqText}
                  onChange={(e) => setNewReqText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRequirement(e);
                    }
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  className="select-standard"
                  value={newReqCategory}
                  onChange={(e) => setNewReqCategory(parseInt(e.target.value, 10))}
                  style={{ width: '150px' }}
                >
                  <option value={0}>Skill</option>
                  <option value={1}>Experience</option>
                  <option value={2}>Education</option>
                  <option value={3}>Certification</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Importance
                </label>
                <select
                  className="select-standard"
                  value={newReqType}
                  onChange={(e) => setNewReqType(parseInt(e.target.value, 10))}
                  style={{ width: '130px' }}
                >
                  <option value={0}>Mandatory</option>
                  <option value={1}>Preferred</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddRequirement}
                className="btn btn-secondary"
                style={{ height: '40px' }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* List of requirements */}
          {requirements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No structured requirements added yet. Add at least 1 mandatory qualification above.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {requirements.map((req, idx) => {
                const isMandatory = Number(req.requirementType) === 0;
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>
                        #{idx + 1}
                      </span>

                      {isMandatory ? (
                        <span title="Mandatory"><ShieldCheck size={18} className="text-emerald" /></span>
                      ) : (
                        <span title="Preferred"><Star size={18} className="text-amber" /></span>
                      )}

                      <span className={`status-badge ${isMandatory ? 'status-approved' : 'badge-role'}`} style={{ fontSize: '0.7rem' }}>
                        {getCategoryLabel(req.requirementCategory)} • {isMandatory ? 'Mandatory' : 'Preferred'}
                      </span>

                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {req.requirementText}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveRequirement(idx, 'up')}
                        disabled={idx === 0}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveRequirement(idx, 'down')}
                        disabled={idx === requirements.length - 1}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="btn btn-outline btn-sm text-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to="/company/jobs" className="btn btn-outline">
            Cancel
          </Link>
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={submitting}
          >
            {submitting ? (
              'Saving Vacancy...'
            ) : (
              <>
                <Save size={18} /> {isEditing ? 'Save Vacancy Changes' : 'Save as Draft'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </PageTransition>
  );
};
