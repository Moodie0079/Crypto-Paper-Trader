require 'faye/websocket'
require 'eventmachine'
require 'json'

class BinancePriceStream
  BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker'

  SYMBOL_MAP = {
    'BTCUSDT' => 'BTC',
    'ETHUSDT' => 'ETH',
    'SOLUSDT' => 'SOL'
  }.freeze

  def self.start
    Thread.new do
      Rails.logger.info "=== Starting Binance WebSocket connection ==="
      
      EM.run do
        connect
      end
    end
  end

  def self.connect
    ws = Faye::WebSocket::Client.new(BINANCE_WS_URL)

    ws.on :open do |event|
      Rails.logger.info "[Binance] WebSocket connected"
    end

    ws.on :message do |event|
      handle_message(event.data)
    end

    ws.on :close do |event|
      Rails.logger.warn "[Binance] WebSocket closed (code: #{event.code}). Reconnecting in 5s..."
      EM.add_timer(5) { connect }
    end

    ws.on :error do |event|
      Rails.logger.error "[Binance] WebSocket error: #{event.message}"
    end
  end

  def self.handle_message(data)
    parsed = JSON.parse(data)
    
    # Note to self: Binance sends data in format: { "stream": "btcusdt@ticker", "data": {...} }
    return unless parsed['data']

    ticker = parsed['data']
    binance_symbol = ticker['s'] # Would be recieving "BTCUSDT" for example.
    price = ticker['c'].to_f 

    symbol = SYMBOL_MAP[binance_symbol]
    return unless symbol

    # Update database
    market_price = MarketPrice.find_or_initialize_by(symbol: symbol)
    
    # Only broadcast if price actually changed
    if market_price.price_usd.to_f != price
      market_price.update!(price_usd: price)
      
      # Broadcast to all connected clients
      ActionCable.server.broadcast('prices_channel', {
        market_prices: MarketPrice.all.as_json(only: [:symbol, :price_usd])
      })
    end
  rescue JSON::ParserError => e
    Rails.logger.error "[Binance] JSON parse error: #{e.message}"
  rescue => e
    Rails.logger.error "[Binance] Error handling message: #{e.message}"
  end
end
