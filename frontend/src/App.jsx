import React, { useState, useEffect } from 'react';
import CreateJob from './components/CreateJob';

const App = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
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
    // Add the newly created job to the top of the list
    setJobs((prevJobs) => [newJob, ...prevJobs]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Hirescore Job Board
          </h1>
          <p className="text-gray-400">Manage and create new job postings</p>
        </header>

        <section>
          <CreateJob onJobCreated={handleJobCreated} />
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
            Latest Jobs
          </h2>
          {loading && <p className="text-gray-400 animate-pulse">Loading jobs...</p>}
          {error && <p className="text-red-400 bg-red-900/20 p-4 rounded-md">{error}</p>}
          
          {!loading && !error && jobs.length === 0 && (
            <p className="text-gray-400 bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
              No jobs posted yet. Create the first one above!
            </p>
          )}

          <div className="space-y-4 shadow-sm">
            {jobs.map((job, index) => (
              <div 
                key={job.id || job._id || index} 
                className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
