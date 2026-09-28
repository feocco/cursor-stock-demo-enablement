import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const alphaVantageGetMock = jest.fn();
const axiosGetMock = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: alphaVantageGetMock,
    })),
    get: axiosGetMock,
  },
}));

const stockService = await import('../backend/services/stockService.js');
const { getStockNews, classifyNewsSentiment } = stockService;

const originalEnv = { ...process.env };

describe('News sentiment classification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STOCK_NEWS_PROVIDER = 'mock';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('classifies "product update" as neutral (not positive)', () => {
    expect(classifyNewsSentiment('product update', '')).toBe('neutral');
    expect(classifyNewsSentiment('Company announces product update focused on enterprise', '')).toBe('neutral');
  });

  it('classifies "upcoming catalysts" as neutral (not positive)', () => {
    expect(classifyNewsSentiment('upcoming catalysts', '')).toBe('neutral');
    expect(classifyNewsSentiment('What to watch for in the next trading week', 'upcoming catalysts')).toBe('neutral');
  });

  it('classifies "supplier warning" as negative', () => {
    expect(classifyNewsSentiment('supplier warning', '')).toBe('negative');
    expect(classifyNewsSentiment('Stock slips after supplier warning on margin pressure', '')).toBe('negative');
  });

  it('classifies "edges down" phrase as negative', () => {
    expect(classifyNewsSentiment('edges down as traders take profit', '')).toBe('negative');
    expect(classifyNewsSentiment('Stock edges down in late trading', '')).toBe('negative');
  });

  it('classifies "extends gains" as positive', () => {
    expect(classifyNewsSentiment('extends gains as investors react', '')).toBe('positive');
    expect(classifyNewsSentiment('Company extends gains on strong guidance', '')).toBe('positive');
  });

  it('avoids false positives from substring matches', () => {
    // 'up' should NOT match inside 'update', 'supplier', 'upcoming', 'run-up'
    expect(classifyNewsSentiment('update', '')).toBe('neutral');
    expect(classifyNewsSentiment('supplier', '')).toBe('neutral');
    expect(classifyNewsSentiment('upcoming', '')).toBe('neutral');
    
    // 'cut' should NOT match inside 'execute'
    expect(classifyNewsSentiment('execute', '')).toBe('neutral');
    
    // 'down' should NOT double-count inside 'downgrade'
    const downgradeScore = classifyNewsSentiment('downgrade', '');
    expect(downgradeScore).toBe('negative'); // Just one negative hit, not two
  });

  it('classifies clearly negative headlines correctly in mock feed', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    const negativeHeadlines = [
      'slips after supplier warning',
      'faces downgrade',
      'demand outlook weakens',
      'edges down as traders take profit',
    ];

    negativeHeadlines.forEach((fragment) => {
      const article = news.find((n) => n.headline.toLowerCase().includes(fragment));
      expect(article).toBeDefined();
      expect(article.sentiment).toBe('negative');
    });
  });

  it('classifies clearly positive headlines correctly in mock feed', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    const positiveHeadlines = [
      'extends gains',
      'raise targets',
      'strong growth outlook',
    ];

    positiveHeadlines.forEach((fragment) => {
      const article = news.find((n) => n.headline.toLowerCase().includes(fragment));
      expect(article).toBeDefined();
      expect(article.sentiment).toBe('positive');
    });
  });

  it('classifies neutral headlines correctly in mock feed', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    const neutralHeadlines = [
      'announces product update',
      'what to watch',
      'hiring plan signals steady expansion',
    ];

    neutralHeadlines.forEach((fragment) => {
      const article = news.find((n) => n.headline.toLowerCase().includes(fragment));
      expect(article).toBeDefined();
      expect(article.sentiment).toBe('neutral');
    });
  });

  it('returns all news articles with sentiment tags', async () => {
    const { news } = await getStockNews('AAPL', { limit: 100 });
    
    expect(news.length).toBeGreaterThan(0);
    news.forEach((article) => {
      expect(article).toHaveProperty('sentiment');
      expect(['positive', 'negative', 'neutral']).toContain(article.sentiment);
    });
  });
});
