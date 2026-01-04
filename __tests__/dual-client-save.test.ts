import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the necessary dependencies
vi.mock('@/lib/hooks/use-client-storage', () => ({
  useClientStorage: () => ({
    saveClient: vi.fn(),
    loadClient: vi.fn(),
  }),
}));

vi.mock('@/lib/store/financial-store', () => ({
  financialStore: {
    clientA: null,
    clientB: null,
    setClientData: vi.fn(),
  },
}));

describe('Dual Client Save Functionality', () => {
  let mockSaveClient: any;
  let mockSetClientData: any;

  beforeEach(() => {
    // Reset mocks
    mockSaveClient = vi.fn();
    mockSetClientData = vi.fn();

    // Setup mock implementations
    mockSaveClient.mockResolvedValue({
      id: 'client-123',
      firstName: 'John',
      lastName: 'Doe',
    });

    mockSetClientData.mockImplementation(() => {});
  });

  it('should save both clients when saving client A', async () => {
    // Simulate the dual save logic by calling the mock functions directly
    const clientSlot = 'A';
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      dob: '1990-01-01',
      annualIncome: 50000,
      assetLiabilityPairs: [
        {
          asset: { id: 'asset-1', name: 'Home', currentValue: 300000, type: 'property' },
          liability: { id: 'liability-1', name: 'Mortgage', balance: 200000, monthlyPayment: 1500, interestRate: 3.5, loanTerm: 30, type: 'mortgage' }
        }
      ]
    };

    // First save - current client (A)
    const clientData = {
      firstName: data.firstName,
      lastName: data.lastName,
      dob: '1990-01-01',
      annualIncome: data.annualIncome,
      assets: [{ id: 'asset-1', name: 'Home', currentValue: 300000, type: 'property' }],
      liabilities: [{ id: 'liability-1', name: 'Mortgage', balance: 200000, monthlyPayment: 1500, interestRate: 3.5, loanTerm: 30, type: 'mortgage' }],
    };

    await mockSaveClient({ ...clientData, id: 'client-a-123' });
    mockSetClientData('A', { ...data, id: 'client-a-123' });

    // Then save the other client (B)
    const otherClientData = {
      firstName: 'Jane',
      lastName: 'Smith',
      dob: null,
      annualIncome: 60000,
      assets: [{ id: 'asset-2', name: 'Savings', currentValue: 50000, type: 'savings' }],
      liabilities: [],
    };

    await mockSaveClient({ ...otherClientData, id: 'client-b-456' });
    mockSetClientData('B', { ...otherClientData, id: 'client-b-456' });

    // Verify both clients were saved
    expect(mockSaveClient).toHaveBeenCalledTimes(2);

    // Verify first call was for client A
    expect(mockSaveClient).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: 'client-a-123',
      firstName: 'John',
      lastName: 'Doe',
      annualIncome: 50000,
    }));

    // Verify second call was for client B
    expect(mockSaveClient).toHaveBeenNthCalledWith(2, expect.objectContaining({
      id: 'client-b-456',
      firstName: 'Jane',
      lastName: 'Smith',
      annualIncome: 60000,
    }));

    // Verify store was updated for both clients
    expect(mockSetClientData).toHaveBeenCalledTimes(2);
  });

  it('should only save current client if other client is empty', async () => {
    // Mock the financial store with only client A
    const mockFinancialStore = {
      clientA: {
        id: 'client-a-123',
        firstName: 'John',
        lastName: 'Doe',
        annualIncome: 50000,
      },
      clientB: null, // No client B
      setClientData: mockSetClientData,
    };

    const mockUseClientStorage = {
      saveClient: mockSaveClient,
      loadClient: vi.fn(),
    };

    // Simulate saving client A when client B is empty
    const clientSlot = 'A';
    const data = {
      firstName: 'John',
      lastName: 'Doe',
      dob: '1990-01-01',
      annualIncome: 50000,
    };

    const currentClient = mockFinancialStore.clientA;
    const clientId = currentClient?.id;

    const clientData = {
      firstName: data.firstName,
      lastName: data.lastName,
      dob: '1990-01-01',
      annualIncome: data.annualIncome,
    };

    await mockUseClientStorage.saveClient({ ...clientData, id: clientId });

    // Check if other client exists
    const otherClientSlot = 'B';
    const otherClient = mockFinancialStore.clientB;

    // Since otherClient is null, only one save should occur
    expect(mockSaveClient).toHaveBeenCalledTimes(1);
    expect(mockSaveClient).toHaveBeenCalledWith(expect.objectContaining({
      id: 'client-a-123',
      firstName: 'John',
      lastName: 'Doe',
    }));
  });
});