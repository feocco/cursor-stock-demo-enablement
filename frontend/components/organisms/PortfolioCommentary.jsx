import { usePortfolio } from '../../context/PortfolioContext';
import { useMultipleQuotes } from '../../hooks/useStockData';
import { usePortfolioAnalysis } from '../../hooks/usePortfolioAnalysis';
import Button from '../atoms/Button';

const PortfolioCommentary = () => {
  const { holdings } = usePortfolio();
  const symbols = holdings.map(h => h.symbol);
  const { quotes } = useMultipleQuotes(symbols);
  const { analysis, loading, error, timestamp, analyzePortfolio } = usePortfolioAnalysis();

  const handleAnalyze = () => {
    // Prepare holdings data for API
    const holdingsData = holdings.map(holding => ({
      symbol: holding.symbol,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
    }));

    analyzePortfolio(holdingsData);
  };

  if (holdings.length === 0) {
    return (
      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-8">
        <div className="text-center text-gray-400 dark:text-gray-400 light:text-gray-600">
          <p className="text-lg mb-2">No holdings to analyze</p>
          <p className="text-sm">Add stocks to your portfolio to get AI-powered recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white dark:text-white light:text-gray-900">AI Portfolio Analysis</h3>
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </Button>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-4 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 rounded animate-pulse w-5/6"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Timestamp */}
          {timestamp && (
            <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
              Last updated: {new Date(timestamp).toLocaleString()}
            </p>
          )}

          {/* Executive Summary */}
          {analysis.summary && (
            <div>
              <h4 className="text-lg font-semibold text-white dark:text-white light:text-gray-900 mb-2">Executive Summary</h4>
              <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Holdings Analysis */}
          {analysis.holdings_analysis && analysis.holdings_analysis.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white dark:text-white light:text-gray-900 mb-3">Holdings Analysis</h4>
              <div className="space-y-3">
                {analysis.holdings_analysis.map((item, index) => {
                  const recommendationColors = {
                    BUY: 'text-green-400 bg-green-900/20 border-green-700',
                    SELL: 'text-red-400 bg-red-900/20 border-red-700',
                    HOLD: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
                  };

                  const sentimentColors = {
                    positive: 'text-green-400',
                    negative: 'text-red-400',
                    neutral: 'text-gray-400 dark:text-gray-400 light:text-gray-600',
                  };

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${recommendationColors[item.recommendation] || 'border-gray-700 dark:border-gray-700 light:border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-white dark:text-white light:text-gray-900">{item.symbol}</span>
                          <span className={`ml-3 text-sm ${sentimentColors[item.sentiment] || 'text-gray-400 dark:text-gray-400 light:text-gray-600'}`}>
                            ({item.sentiment || 'neutral'})
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.recommendation === 'BUY' ? 'bg-green-600 text-white' :
                          item.recommendation === 'SELL' ? 'bg-red-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {item.recommendation || 'HOLD'}
                        </span>
                      </div>
                      {item.reasoning && (
                        <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mt-2">{item.reasoning}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {analysis.risk_assessment && (
            <div>
              <h4 className="text-lg font-semibold text-white dark:text-white light:text-gray-900 mb-2">Risk Assessment</h4>
              <div className="bg-gray-900/50 dark:bg-gray-900/50 light:bg-gray-50 border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 mr-2">Risk Level:</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    analysis.risk_assessment.level === 'low' ? 'bg-green-600 text-white' :
                    analysis.risk_assessment.level === 'high' ? 'bg-red-600 text-white' :
                    'bg-yellow-600 text-white'
                  }`}>
                    {analysis.risk_assessment.level?.toUpperCase() || 'MODERATE'}
                  </span>
                </div>
                {analysis.risk_assessment.details && (
                  <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mt-2">{analysis.risk_assessment.details}</p>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white dark:text-white light:text-gray-900 mb-3">Actionable Recommendations</h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-400 dark:text-blue-400 light:text-blue-600 mr-2 mt-1">•</span>
                    <span className="text-gray-300 dark:text-gray-300 light:text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-4">Click "Generate Analysis" to get AI-powered portfolio recommendations</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-500">Analysis includes risk assessment, rebalancing suggestions, and entry/exit timing</p>
        </div>
      )}
    </div>
  );
};

export default PortfolioCommentary;


