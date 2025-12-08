# Start Binance WebSocket for real-time price updates
Rails.application.config.after_initialize do
  if defined?(Rails::Server)
    Rails.logger.info "=== Starting Binance real-time price stream ==="
    BinancePriceStream.start
  end
end
