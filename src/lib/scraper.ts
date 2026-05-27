import api from './api';

export interface ScraperResult {
  jobs: number;
  scholarships: number;
  errors: Array<{ name: string; url: string; error: string }>;
}

export interface ScraperStatus {
  isRunning: boolean;
  lastRun: string | null;
  lastResult: ScraperResult | null;
}

export const scraperAPI = {
  // Trigger scraper manually (requires auth)
  triggerScraper: async (): Promise<{ message: string }> => {
    const { data } = await api.post('/scraper/trigger');
    return data;
  },

  // Get scraper status (requires auth)
  getScraperStatus: async (): Promise<ScraperStatus> => {
    const { data } = await api.get<ScraperStatus>('/scraper/status');
    return data;
  },

  // Get scraper logs (admin only)
  getScraperLogs: async (limit: number = 50): Promise<{ logs: string[] }> => {
    const { data } = await api.get(`/scraper/logs?limit=${limit}`);
    return data;
  },
};