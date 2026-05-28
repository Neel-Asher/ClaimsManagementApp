import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FraudDetectionReport from '../pages/fraud/FraudReport';
import { fraudService, claimService, analyticsService } from '../services/dataService';

// Mock the Recharts module so tests don't break on SVG rendering
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />
}));

vi.mock('../services/dataService', () => ({
  fraudService: { getAllPredictions: vi.fn() },
  claimService: { getAll: vi.fn() },
  analyticsService: { getFraudDistribution: vi.fn() }
}));

describe('FraudDetectionReport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    fraudService.getAllPredictions.mockResolvedValue([]);
    analyticsService.getFraudDistribution.mockResolvedValue([]);
    claimService.getAll.mockResolvedValue([]);
    
    // We do not wait for the promise to resolve so we can see the loading state
    const { container } = render(<FraudDetectionReport />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders data correctly after loading', async () => {
    const mockPredictions = [
      { claim_id: 'CLM-001', fraud_probability: 85, risk_status: 'High Risk', recommendation: 'Reject' },
      { claim_id: 'CLM-002', fraud_probability: 45, risk_status: 'Medium Risk', recommendation: 'Investigate' },
      { claim_id: 'CLM-003', fraud_probability: 10, risk_status: 'Low Risk', recommendation: 'Approve' }
    ];
    
    fraudService.getAllPredictions.mockResolvedValue(mockPredictions);
    analyticsService.getFraudDistribution.mockResolvedValue([{ name: 'High', value: 1 }]);
    claimService.getAll.mockResolvedValue([{ claim_id: 'CLM-001', claim_type: 'Auto' }]);

    render(<FraudDetectionReport />);

    await waitFor(() => {
      expect(screen.getByText('Fraud Detection Report')).toBeInTheDocument();
    });

    // Verify stats cards
    expect(screen.getByText('Total Predictions')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // total
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 high risk

    // Verify latest high risk prediction displays
    expect(screen.getByText('CLM-001')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('handles empty predictions gracefully', async () => {
    fraudService.getAllPredictions.mockResolvedValue([]);
    analyticsService.getFraudDistribution.mockResolvedValue([]);
    claimService.getAll.mockResolvedValue([]);

    render(<FraudDetectionReport />);

    await waitFor(() => {
      expect(screen.getByText('No high-risk predictions found.')).toBeInTheDocument();
    });
  });
});
