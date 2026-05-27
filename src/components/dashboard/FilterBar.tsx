'use client';
import { useState } from 'react';

interface FilterBarProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  activeTab: 'jobs' | 'scholarships';
}

export default function FilterBar({ filters, onFilterChange, activeTab }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const countries = ['Nigeria', 'USA', 'UK', 'Canada', 'Germany', 'Remote'];
  const jobTypes = ['full-time', 'part-time', 'remote', 'contract', 'internship'];

  return (
    <div className="filter-bar">
      <div className="filter-bar-main">
        <div className="search-input">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={`Search ${activeTab === 'jobs' ? 'jobs by title or company' : 'scholarships by field'}`}
            value={filters.q}
            onChange={(e) => onFilterChange({ q: e.target.value })}
          />
        </div>
        
        <button className="filter-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          <i className="fas fa-sliders-h"></i>
          Filters {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="filter-options">
          <div className="filter-group">
            <label>Country</label>
            <select value={filters.country} onChange={(e) => onFilterChange({ country: e.target.value })}>
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {activeTab === 'jobs' && (
            <div className="filter-group">
              <label>Job Type</label>
              <select value={filters.job_type} onChange={(e) => onFilterChange({ job_type: e.target.value })}>
                <option value="">All Types</option>
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          <button className="clear-filters" onClick={() => onFilterChange({ country: '', job_type: '', q: '' })}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}