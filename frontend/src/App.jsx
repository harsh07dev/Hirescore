import React, { useState, useEffect } from 'react';
import CreateJob from './components/CreateJob';
import UploadResumes from './components/UploadResumes';

// ─── Candidate Card ──────────────────────────────────────────────────────────
const CandidateCard = ({ candidate }) => {
  const isPending = !candidate.fit_score || candidate.fit_score === 0;
  const truncated =
    candidate.resume_text && candidate.resume_text.length > 100
      ? candidate.resume_text.slice(0, 100) + '…'
      : candidate.resume_text || 'No resume text available.';

  const stageColors = {
    applied: 'bg-blue-900/40 text-blue-300 border-blue-700',
    screening: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
    interview: 'bg-purple-900/40 text-purple-300 border-purple-700',
    offer: 'bg-green-900/40 text-green-300 border-green-700',
    rejected: 'bg-red-900/40 text-red-300 border-red-700',
  };

  const stageClass =
    stageColors[candidate.stage?.toLowerCase()] ||
    'bg-gray-700/50 text-gray-300 border-gray-600';

  return (
    <div className="bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-lg p-5 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
            {candidate.name ? candidate.name[0].toUpperCase() : '?'}
          </div>
          <span className="font-semibold text-white truncate">{candidate.name || 'Unknown'}</span>
        </div>

        {/* Fit Score */}
        <div
          className={`flex-shrink-0 text-sm font-semibold px-3 py-1 rounded-full border ${
            isPending
              ? 'bg-gray-700/50 text-gray-400 border-gray-600'
              : candidate.fit_score >= 75
              ? 'bg-green-900/40 text-green-300 border-green-700'
              : candidate.fit_score >= 50
              ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
              : 'bg-red-900/40 text-red-300 border-red-700'
          }`}
        >
          {isPending ? 'Pending' : `Score: ${candidate.fit_score}`}
        </div>
      </div>

      {/* Stage Badge */}
      <span
        className={`inline-block text-xs font-medium px-2 py-0.5 rounded border mb-3 ${stageClass}`}
      >
        {candidate.stage || 'applied'}
      </span>

      {/* Resume Snippet */}
      <p className="text-gray-400 text-sm leading-relaxed font-mono">{truncated}</p>
    </div>
  );
};

// ─── Job Detail View ─────────────────────────────────────────────────────────
const JobDetail = ({ job, onBack }) => {
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState('');

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    setCandidatesError('');
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/jobs/${job.id}/candidates`
      );
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      setCandidatesError(err.message || 'Could not load candidates.');
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Fetch candidates when the detail view mounts
  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        id="back-to-jobs-btn"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all jobs
      </button>

      {/* Job Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
          {job.description}
        </p>
      </div>

      {/* Upload Section */}
      <UploadResumes jobId={job.id} onUploadComplete={fetchCandidates} />

      {/* Candidates Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
          Candidates
          {!candidatesLoading && (
            <span className="text-sm font-normal text-gray-400">
              ({candidates.length})
            </span>
          )}
        </h3>

        {candidatesLoading && (
          <p className="text-gray-400 animate-pulse text-sm">Loading candidates…</p>
        )}

        {candidatesError && (
          <p className="text-red-400 bg-red-900/20 border border-red-800 p-4 rounded-md text-sm">
            {candidatesError}
          </p>
        )}

        {!candidatesLoading && !candidatesError && candidates.length === 0 && (
          <div className="text-center bg-gray-800 border border-gray-700 border-dashed rounded-lg p-8 text-gray-400 text-sm">
            No candidates yet. Upload resumes above to get started.
          </div>
        )}

        <div className="space-y-3">
          {candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────
const App = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobCreated = (newJob) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  // ── Job Detail View ──
  if (selectedJob) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
              HireScore
            </h1>
            <p className="text-gray-400 text-sm">AI-powered candidate screening</p>
          </header>
          <JobDetail job={selectedJob} onBack={() => setSelectedJob(null)} />
        </div>
      </div>
    );
  }

  // ── Jobs List View ──
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            HireScore
          </h1>
          <p className="text-gray-400">Create jobs and screen candidates with AI</p>
        </header>

        <section>
          <CreateJob onJobCreated={handleJobCreated} />
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
            Posted Jobs
          </h2>

          {loading && (
            <p className="text-gray-400 animate-pulse">Loading jobs…</p>
          )}
          {error && (
            <p className="text-red-400 bg-red-900/20 border border-red-800 p-4 rounded-md">
              {error}
            </p>
          )}

          {!loading && !error && jobs.length === 0 && (
            <p className="text-gray-400 bg-gray-800 p-6 rounded-lg text-center border border-gray-700 border-dashed">
              No jobs posted yet. Create the first one above!
            </p>
          )}

          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div
                key={job.id || index}
                className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-1">{job.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                  <button
                    id={`view-job-${job.id || index}`}
                    onClick={() => setSelectedJob(job)}
                    className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition duration-150"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
