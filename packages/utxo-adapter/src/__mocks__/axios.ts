/**
 * Mock implementation of axios for testing
 */

interface MockResponse {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

// Mock axios instance
const createMockAxiosInstance = () => ({
  get: jest.fn().mockImplementation((url: string): Promise<MockResponse> => {
    // Mock different API responses based on URL patterns
    if (url.includes('/blocks/tip/height')) {
      return Promise.resolve({
        data: 700000,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    if (url.includes('/fee-estimates')) {
      return Promise.resolve({
        data: {
          '2': '10',
          '6': '5', 
          '144': '1'
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    if (url.includes('/address/') && url.includes('/utxo')) {
      return Promise.resolve({
        data: [
          {
            txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            vout: 0,
            value: 100000,
            scriptPubKey: '76a914751e76c4e76b2f4ed6b35b9b0f6d6b39bb5a9cc888ac',
            status: {
              confirmed: true,
              block_height: 699990,
              block_hash: '00000000000000000007878ec04bb2b2e12317804810f4c26033585b3f81ffaa'
            }
          },
          {
            txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            vout: 1,
            value: 50000,
            scriptPubKey: '76a914751e76c4e76b2f4ed6b35b9b0f6d6b39bb5a9cc888ac',
            status: {
              confirmed: true,
              block_height: 699995,
              block_hash: '00000000000000000007878ec04bb2b2e12317804810f4c26033585b3f81ffbb'
            }
          }
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    if (url.includes('/address/')) {
      return Promise.resolve({
        data: {
          chain_stats: {
            funded_txo_sum: 1000000,
            spent_txo_sum: 500000
          },
          mempool_stats: {
            funded_txo_sum: 100000,
            spent_txo_sum: 0
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    if (url.includes('/unspent?active=')) {
      return Promise.resolve({
        data: {
          unspent_outputs: [
            {
              tx_hash_big_endian: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              tx_output_n: 0,
              value: 100000,
              script: '76a914...',
              confirmations: 10
            }
          ]
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    if (url.includes('/balance?active=')) {
      const address = url.split('active=')[1];
      return Promise.resolve({
        data: {
          [address]: {
            final_balance: 1000000,
            unconfirmed_balance: 100000
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    if (url.includes('/latestblock')) {
      return Promise.resolve({
        data: {
          height: 700000,
          hash: '00000000000000000007878ec04bb2b2e12317804810f4c26033585b3f81ffaa',
          time: Date.now() / 1000
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    // Default response
    return Promise.resolve({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    });
  }),
  
  post: jest.fn().mockImplementation((url: string, data: any): Promise<MockResponse> => {
    if (url.includes('/tx')) {
      return Promise.resolve({
        data: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    if (url.includes('/pushtx')) {
      return Promise.resolve({
        data: { txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }
    
    return Promise.resolve({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    });
  })
});

// Mock axios.create
const mockAxios = {
  create: jest.fn().mockImplementation((config?: any) => {
    return createMockAxiosInstance();
  }),
  
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  
  defaults: {
    baseURL: '',
    headers: {
      common: {},
      delete: {},
      get: {},
      head: {},
      post: {},
      put: {},
      patch: {}
    },
    timeout: 0,
    transformRequest: [],
    transformResponse: [],
    validateStatus: () => true
  },
  
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  }
};

export default mockAxios;

// Named export for AxiosInstance type compatibility
export const AxiosInstance = mockAxios;
