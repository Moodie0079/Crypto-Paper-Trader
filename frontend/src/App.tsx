import { useEffect, useState, useRef, useCallback } from 'react';
// @ts-ignore - No types available for @rails/actioncable
import { createConsumer } from '@rails/actioncable';

interface DashboardData {
  balance_usd: string;
  starting_balance: string;
  assets: Array<{ symbol: string; amount: string; cost_basis_usd?: string }>;
  market_prices: Array<{ symbol: string; price_usd: string }>;
}

const DEFAULT_STARTING_BALANCE = 100000;

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [startingBalance, setStartingBalance] = useState(DEFAULT_STARTING_BALANCE);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAmount, setResetAmount] = useState('');

  const cableRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/portfolio');
      const json = await res.json();
      setData(json);
      setStartingBalance(parseFloat(json.starting_balance));
      setLoading(false);
    } catch (err) {
      console.error("Rails offline");
    }
  }, []);

  useEffect(() => {
    // Add animation styles once
    if (!document.getElementById('app-animations')) {
      const style = document.createElement('style');
      style.id = 'app-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    fetchData();

    // Create cable and subscription
    if (!cableRef.current) {
      cableRef.current = createConsumer('ws://localhost:3000/cable');
    }

    if (!subscriptionRef.current) {
      console.log('[WS] Creating subscription...');
      subscriptionRef.current = cableRef.current.subscriptions.create('PricesChannel', {
        connected() {
          console.log('[WS] Connected to PricesChannel');
        },
        disconnected() {
          console.log('[WS] Disconnected from PricesChannel');
        },
        received(priceData: any) {
          console.log('[WS] Received:', priceData);
          if (priceData.error) {
            setLastUpdate(`Error: ${priceData.error}`);
          } else if (priceData.market_prices) {
            setData(prev => prev ? { ...prev, market_prices: priceData.market_prices } : null);
            setLastUpdate(new Date().toLocaleTimeString());
          }
        }
      });
    }

    return () => {
      if (subscriptionRef.current) {
        console.log('[WS] Unsubscribing...');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (cableRef.current) {
        cableRef.current.disconnect();
        cableRef.current = null;
      }
    };
  }, [fetchData]);

  const handleBuy = async (symbol: string, amount: string) => {
    if (!amount) return;
    try {
      const res = await fetch('http://localhost:3000/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, amount }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage(json.message);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
        fetchData();
      } else {
        alert(json.error || "Trade failed");
      }
    } catch (err) {
      alert("Failed to connect");
    }
  };

  const handleSell = async (symbol: string, amount: string) => {
    if (!amount) return;
    try {
      const res = await fetch('http://localhost:3000/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, amount }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage(json.message);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
        fetchData();
      } else {
        alert(json.error || "Sell failed");
      }
    } catch (err) {
      alert("Failed to connect");
    }
  };

  const handleReset = async () => {
    const amount = parseFloat(resetAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid starting amount");
      return;
    }
    
    try {
      const res = await fetch('http://localhost:3000/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starting_balance: amount }),
      });
      const json = await res.json();
      if (res.ok) {
        setStartingBalance(amount);
        setShowResetModal(false);
        setResetAmount('');
        setMessage(`Portfolio reset to $${amount.toLocaleString()}`);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
        fetchData();
      } else {
        alert(json.error || "Reset failed");
      }
    } catch (err) {
      alert("Failed to connect");
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Error loading data</div>;

  // Calculations
  const cashBalance = parseFloat(data.balance_usd);
  const holdingsValue = data.assets.reduce((total, asset) => {
    const price = data.market_prices.find(p => p.symbol === asset.symbol);
    return total + (price ? parseFloat(asset.amount) * parseFloat(price.price_usd) : 0);
  }, 0);
  const totalValue = cashBalance + holdingsValue;
  const totalPnL = totalValue - startingBalance;
  const totalPnLPercent = (totalPnL / startingBalance) * 100;

  const formatMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pnlColor = (val: number) => val >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '900px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>PaperTrader</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {lastUpdate && <span style={{ fontSize: '13px', color: '#64748b' }}>Live • {lastUpdate}</span>}
          <button 
            onClick={() => setShowResetModal(true)}
            style={{ padding: '8px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Portfolio Value</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>${formatMoney(totalValue)}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total P&L</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: pnlColor(totalPnL) }}>
              {totalPnL >= 0 ? '+' : ''}${formatMoney(totalPnL)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Return</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: pnlColor(totalPnL) }}>
              {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Cash Available</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>${formatMoney(cashBalance)}</div>
          </div>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '24px', fontSize: '14px', color: '#64748b' }}>
          <span>Starting: ${formatMoney(startingBalance)}</span>
          <span>Holdings: ${formatMoney(holdingsValue)}</span>
        </div>
      </div>

      {/* Market Section */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Market</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.market_prices.map((coin) => {
          const asset = data.assets.find(a => a.symbol === coin.symbol);
          const quantity = asset ? parseFloat(asset.amount) : 0;
          const coinPrice = parseFloat(coin.price_usd);
          const positionValue = quantity * coinPrice;
          const costBasis = asset ? parseFloat(asset.cost_basis_usd || '0') : 0;
          const positionPnL = positionValue - costBasis;
          const positionPnLPercent = costBasis > 0 ? (positionPnL / costBasis) * 100 : 0;

          return (
            <div key={coin.symbol} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Left: Coin Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 700 }}>{coin.symbol}</span>
                    <span style={{ fontSize: '20px', color: '#334155' }}>${formatMoney(coinPrice)}</span>
                  </div>
                  
                  {quantity > 0 ? (
                    <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>Holdings: </span>
                          <strong>{quantity} {coin.symbol}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Value: </span>
                          <strong>${formatMoney(positionValue)}</strong>
                        </div>
                        {costBasis > 0 && (
                          <div>
                            <span style={{ color: '#64748b' }}>P&L: </span>
                            <strong style={{ color: pnlColor(positionPnL) }}>
                              {positionPnL >= 0 ? '+' : ''}${formatMoney(positionPnL)} ({positionPnL >= 0 ? '+' : ''}{positionPnLPercent.toFixed(2)}%)
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>No holdings</div>
                  )}
                </div>

                {/* Right: Trade Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).elements.namedItem('amount') as HTMLInputElement;
                    handleBuy(coin.symbol, input.value);
                    input.value = '';
                  }} style={{ display: 'flex', gap: '6px' }}>
                    <input type="number" name="amount" step="0.001" placeholder="Qty" required 
                      style={{ padding: '8px 12px', width: '80px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                    <button type="submit" style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                      Buy
                    </button>
                  </form>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).elements.namedItem('amount') as HTMLInputElement;
                    handleSell(coin.symbol, input.value);
                    input.value = '';
                  }} style={{ display: 'flex', gap: '6px' }}>
                    <input type="number" name="amount" step="0.001" placeholder="Qty" required 
                      style={{ padding: '8px 12px', width: '80px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                    <button type="submit" style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                      Sell
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success Toast */}
      {showModal && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#fff', border: '2px solid #22c55e', borderRadius: '12px', padding: '16px 24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', zIndex: 1000, minWidth: '300px', animation: 'slideIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>✓</div>
            <div>
              <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: '2px' }}>Success!</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>{message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '400px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>Reset Portfolio</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>
              This will clear all positions and set a new starting balance.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Starting Balance ($)
              </label>
              <input
                type="number"
                value={resetAmount}
                onChange={(e) => setResetAmount(e.target.value)}
                placeholder="100000"
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowResetModal(false); setResetAmount(''); }}
                style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
              >
                Reset Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
