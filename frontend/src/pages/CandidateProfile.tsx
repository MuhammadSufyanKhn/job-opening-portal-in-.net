import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { candidateApi, candidateDashboardApi } from '../services/api';
import type { CandidateProfile as ProfileType } from '../types/auth';
import type { ExtractedCvSuggestions } from '../types/candidate';
import {
  Globe,
  Link2,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Phone,
  FileText,
  Plus
} from 'lucide-react';

export const CandidateProfile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [initialData, setInitialData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    headline: '',
    summary: '',
    location: '',
    yearsOfExperience: 0,
    linkedInUrl: '',
    gitHubUrl: '',
    portfolioUrl: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    headline: '',
    summary: '',
    location: '',
    yearsOfExperience: 0,
    linkedInUrl: '',
    gitHubUrl: '',
    portfolioUrl: '',
  });

  const [cvSuggestions, setCvSuggestions] = useState<ExtractedCvSuggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await candidateApi.getProfile();
      setProfile(data);

      const loaded = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phoneNumber: data.phoneNumber || '',
        headline: data.headline || '',
        summary: data.summary || '',
        location: data.location || '',
        yearsOfExperience: data.yearsOfExperience || 0,
        linkedInUrl: data.linkedInUrl || '',
        gitHubUrl: data.gitHubUrl || '',
        portfolioUrl: data.portfolioUrl || '',
      };

      setInitialData(loaded);
      setFormData(loaded);
      setIsDirty(false);

      // Also attempt to load CV extracted suggestions
      loadCvSuggestions();
    } catch {
      setErrorMsg('Failed to load candidate profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCvSuggestions = async () => {
    try {
      const suggestions = await candidateDashboardApi.getCvSuggestions();
      setCvSuggestions(suggestions);
    } catch {
      // It's normal if no CV is uploaded yet
      setCvSuggestions(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'yearsOfExperience' ? Number(value) : value,
      };
      setIsDirty(JSON.stringify(updated) !== JSON.stringify(initialData));
      return updated;
    });
  };

  const handleReset = () => {
    if (isDirty && !window.confirm('Discard all unsaved changes and revert to original values?')) {
      return;
    }
    setFormData(initialData);
    setIsDirty(false);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleAppendSkillToSummary = (skill: string) => {
    setFormData(prev => {
      const current = prev.summary ? prev.summary.trim() : '';
      const addition = current.length > 0 ? `\n• Core Competency: ${skill}` : `• Core Competency: ${skill}`;
      const updated = {
        ...prev,
        summary: current + addition,
      };
      setIsDirty(true);
      return updated;
    });
    setSuccessMsg(`Skill "${skill}" copied into your Career Summary.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await candidateApi.updateProfile(formData);
      setProfile(updated);
      setInitialData(formData);
      setIsDirty(false);
      setSuccessMsg('Candidate profile updated and synchronized successfully.');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to update profile. Please verify your entries.';
      setErrorMsg(detail);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="portal-container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading verified candidate profile...</p>
      </div>
    );
  }

  const completionPercentage = profile?.completionPercentage ?? 0;
  const missingFields = profile?.missingFields ?? [];

  return (
    <div className="portal-container" style={{ maxWidth: '960px', padding: '2rem 1.5rem 5rem' }}>
      <motion.div
        className="portal-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Candidate Experience
            </span>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0.25rem 0 0.5rem' }}>
              {profile?.fullName ? `${profile.fullName}'s Profile` : 'Candidate Profile'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem' }}>
              Manage your verified identity, credentials, career history, and portfolio links for job applications.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/candidate/dashboard" className="btn btn-outline btn-sm">
              Dashboard
            </Link>
            <Link to="/candidate/documents" className="btn btn-outline btn-sm">
              <FileText size={15} /> CV Library
            </Link>
          </div>
        </div>

        {/* Profile Completion Indicator */}
        <div
          className="card-form"
          style={{
            padding: '1.5rem 1.75rem',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(255, 255, 255, 1) 100%)',
            borderColor: 'rgba(186, 230, 253, 0.8)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} className="text-primary" />
              <strong style={{ fontSize: '1.1rem' }}>Profile Completion: {completionPercentage}%</strong>
            </div>
            <span className={`status-badge ${completionPercentage === 100 ? 'status-approved' : 'badge-role'}`}>
              {completionPercentage === 100 ? '100% Complete' : `${missingFields.length} Item(s) Missing`}
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(203, 213, 225, 0.5)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <div
              style={{
                height: '100%',
                width: `${completionPercentage}%`,
                backgroundColor: completionPercentage === 100 ? '#10b981' : '#0284c7',
                borderRadius: '999px',
                transition: 'width 0.6s ease'
              }}
            />
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Transparent completion metric calculated from your headline, career summary, location, contact, and uploaded CV. Profile completion is not a ranking score or measure of candidate quality.
          </p>

          {missingFields.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {missingFields.map((field, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.775rem',
                    padding: '0.2rem 0.6rem',
                    backgroundColor: 'rgba(254, 243, 199, 0.8)',
                    color: '#92400e',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(253, 230, 138, 0.8)'
                  }}
                >
                  • {field}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Extracted CV Suggestions Panel */}
        {cvSuggestions && (cvSuggestions.extractedSkills?.length > 0 || cvSuggestions.extractedEducation?.length > 0) && (
          <div
            className="card-form"
            style={{
              padding: '1.5rem 1.75rem',
              marginBottom: '2rem',
              borderColor: 'rgba(224, 231, 255, 0.9)',
              backgroundColor: 'rgba(248, 250, 252, 0.9)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} className="text-primary" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Suggestions Extracted from CV ({cvSuggestions.fileName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="btn btn-outline btn-sm"
              >
                {showSuggestions ? 'Hide Suggestions' : 'Review Suggestions'}
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              These suggestions were parsed from your primary CV document. They are <strong>unconfirmed suggestions</strong> and will not appear on your profile until you review and confirm them.
            </p>

            {showSuggestions && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {cvSuggestions.extractedSkills?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                      Suggested Skills (Click to copy into Summary):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {cvSuggestions.extractedSkills.map((skill, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAppendSkillToSummary(skill)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Click to copy into your career summary"
                        >
                          <Plus size={13} /> {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {cvSuggestions.extractedEducation?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                      Detected Education Credentials:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {cvSuggestions.extractedEducation.map((edu, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cvSuggestions.extractedCertifications?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                      Detected Certifications:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {cvSuggestions.extractedCertifications.map((cert, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="card-form" style={{ padding: '2rem' }}>
          <div className="form-section">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Personal & Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="input-standard"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="input-standard"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Contact Phone Number</label>
                <div className="input-icon-wrapper">
                  <Phone size={17} className="input-icon" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    className="input-standard"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="e.g. +44 20 7946 0912"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Geographic Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="input-standard"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. London, United Kingdom"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="headline">Professional Headline</label>
              <input
                id="headline"
                name="headline"
                type="text"
                className="input-standard"
                value={formData.headline}
                onChange={handleChange}
                placeholder="e.g. Senior Software Architect | Distributed Cloud Systems"
              />
            </div>

            <div className="form-group">
              <label htmlFor="yearsOfExperience">Years of Professional Experience</label>
              <input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                min={0}
                max={50}
                className="input-standard"
                value={formData.yearsOfExperience}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="summary">Career Summary & Core Qualifications</label>
              <textarea
                id="summary"
                name="summary"
                rows={5}
                className="textarea-standard"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Describe your technical background, domain expertise, major projects, and key competencies..."
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                Tip: Enter at least 20 characters describing your technical focus for verified profile status.
              </span>
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>External Portfolio & Social Links</h3>

            <div className="form-group">
              <label htmlFor="linkedInUrl">LinkedIn Profile URL</label>
              <div className="input-icon-wrapper">
                <Link2 size={17} className="input-icon" />
                <input
                  id="linkedInUrl"
                  name="linkedInUrl"
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="gitHubUrl">GitHub Profile URL</label>
              <div className="input-icon-wrapper">
                <Link2 size={17} className="input-icon" />
                <input
                  id="gitHubUrl"
                  name="gitHubUrl"
                  type="url"
                  value={formData.gitHubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="portfolioUrl">Personal Portfolio or Technical Blog URL</label>
              <div className="input-icon-wrapper">
                <Globe size={17} className="input-icon" />
                <input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://myportfolio.dev"
                />
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-outline"
              disabled={!isDirty || isSaving}
            >
              <RotateCcw size={16} /> Discard Unsaved Changes
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ boxShadow: isDirty ? '0 4px 14px rgba(2, 132, 199, 0.3)' : 'none' }}
            >
              <Save size={18} />
              <span>{isSaving ? 'Saving Profile...' : isDirty ? 'Save Profile Changes *' : 'Profile Saved'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
