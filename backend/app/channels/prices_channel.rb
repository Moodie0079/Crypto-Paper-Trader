class PricesChannel < ApplicationCable::Channel
  def subscribed
    stream_from "prices_channel"
  end

  def unsubscribed
  end
end
