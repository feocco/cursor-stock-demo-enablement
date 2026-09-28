import { usePortfolio } from '../../context/PortfolioContext';
import { useMultipleQuotes } from '../../hooks/useStockData';
import { usePortfolioAnalysis } from '../../hooks/usePortfolioAnalysis';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
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
      <Card padding="lg">
        <div className="text-center text-text-muted">
          <p className="text-lg mb-2">No holdings to analyze</p>
          <p className="text-sm">Add stocks to your portfolio to get AI-powered recommendations</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-text">AI Portfolio Analysis</h3>
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
          <div className="h-4 bg-surface-raised rounded animate-pulse"></div>
          <div className="h-4 bg-surface-raised rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-surface-raised rounded animate-pulse w-5/6"></div>
        </div>
      )}

      {error && (
        <div className="bg-loss/10 border border-loss/20 rounded-lg p-4 mb-4">
          <p className="text-loss text-sm">{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {timestamp && (
            <p className="text-xs text-text-muted">
              Last updated: {new Date(timestamp).toLocaleString()}
            </p>
          )}

          {analysis.summary && (
            <div>
              <h4 className="text-base font-semibold text-text mb-2">Executive Summary</h4>
              <p className="text-text-muted leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {analysis.holdings_analysis && analysis.holdings_analysis.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-text mb-3">Holdings Analysis</h4>
              <div className="space-y-3">
                {analysis.holdings_analysis.map((item, index) => {
                  const recommendationColors = {
                    BUY: 'bg-gain/10 border-gain/20',
                    SELL: 'bg-loss/10 border-loss/20',
                    HOLD: 'bg-yellow-500/10 border-yellow-500/20',
                  };

                  const sentimentColors = {
                    positive: 'text-gain',
                    negative: 'text-loss',
                    neutral: 'text-text-muted',
                  };

                  const badgeVariant = 
                    item.recommendation === 'BUY' ? 'gain' :
                    item.recommendation === 'SELL' ? 'loss' : 
                    'muted';

                  return (
                    <div
                      key={index}
                      className={`border rounded-xl p-4 ${recommendationColors[item.recommendation] || 'border-border'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-text">{item.symbol}</span>
                          <span className={`ml-3 text-sm ${sentimentColors[item.sentiment] || 'text-text-muted'}`}>
                            ({item.sentiment || 'neutral'})
                          </span>
                        </div>
                        <Badge variant={badgeVariant} size="sm">
                          {item.recommendation || 'HOLD'}
                        </Badge>
                      </div>
                      {item.reasoning && (
                        <p className="text-sm text-text-muted mt-2">{item.reasoning}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysis.risk_assessment && (
            <div>
              <h4 className="text-base font-semibold text-text mb-2">Risk Assessment</h4>
              <div className="bg-surface-raised border border-border rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-text-muted mr-2">Risk Level:</span>
                  <Badge 
                    variant={
                      analysis.risk_assessment.level === 'low' ? 'gain' :
                      analysis.risk_assessment.level === 'high' ? 'loss' :
                      'muted'
                    }
                    size="sm"
                  >
                    {analysis.risk_assessment.level?.toUpperCase() || 'MODERATE'}
                  </Badge>
                </div>
                {analysis.risk_assessment.details && (
                  <p className="text-sm text-text-muted mt-2">{analysis.risk_assessment.details}</p>
                )}
              </div>
            </div>
          )}

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-text mb-3">Actionable Recommendations</h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-accent mr-2 mt-1">•</span>
                    <span className="text-text-muted">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-text-muted mb-4">Click "Generate Analysis" to get AI-powered portfolio recommendations</p>
          <p className="text-sm text-text-muted/70">Analysis includes risk assessment, rebalancing suggestions, and entry/exit timing</p>
        </div>
      )}
    </Card>
  );
};

export default PortfolioCommentary;


