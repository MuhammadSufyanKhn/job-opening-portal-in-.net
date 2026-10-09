import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { candidateApi } from '../services/api';
import type { CandidateProfile as ProfileType } from '../types/auth';
import { Globe, Link2, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const CandidateProfile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    summary: '',
    location: '',
    yearsOfExperience: 0,
    linkedInUrl: '',
    gitHubUrl: '',
    portfolioUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        headline: data.headline || '',
        summary: data.summary || '',
        location: data.location || '',
        yearsOfExperience: data.yearsOfExperience || 0,
        linkedInUrl: data.linkedInUrl || '',
        gitHubUrl: data.gitHubUrl || '',
        portfolioUrl: data.portfolioUrl || '',
      });
    } catch {
      setErrorMsg('Failed to load candidate profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearsOfExperience' ? Number(value) : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await candidateApi.updateProfile(formData);
      setProfile(updated);
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to update profile. Please verify your entries.';
      setErrorMsg(detail);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading-state">Loading candidate profile...</div>;
  }

  return (
    <div className="portal-container">
      <motion.div
        className="portal-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="page-header">
          <div>
            <h1>{profile?.fullName ? `${profile.fullName}'s Profile` : 'Candidate Profile'}</h1>
            <p>Manage your verified identity, credentials, and portfolio links for job applications</p>
          </div>
        </div>

        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="card-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
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
                <label htmlFor="lastName">Last Name</label>
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

            <div className="form-group">
              <label htmlFor="headline">Professional Headline</label>
              <input
                id="headline"
                name="headline"
                type="text"
                className="input-standard"
                value={formData.headline}
                onChange={handleChange}
                placeholder="e.g. Senior Software Architect | Distributed Systems"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location</label>
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
            </div>

            <div className="form-group">
              <label htmlFor="summary">Career Summary</label>
              <textarea
                id="summary"
                name="summary"
                rows={4}
                className="textarea-standard"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Describe your technical background, major achievements, and core competencies..."
              />
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '2rem' }}>
            <h3>External Links & Verification</h3>
            <div className="form-group">
              <label htmlFor="linkedInUrl">LinkedIn Profile URL</label>
              <div className="input-icon-wrapper">
                <Link2 size={18} className="input-icon" />
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
                <Link2 size={18} className="input-icon" />
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
              <label htmlFor="portfolioUrl">Personal Portfolio or Website URL</label>
              <div className="input-icon-wrapper">
                <Globe size={18} className="input-icon" />
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

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={18} />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
