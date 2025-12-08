class TradesController < ApplicationController
  # GET /portfolio
  def index
    user = User.find_by(id: 1)
    
    if user.nil?
      render json: { error: "User not found" }, status: 404
      return
    end
    
    render json: {
      balance_usd: user.balance_usd,
      starting_balance: user.starting_balance,
      assets: user.assets,           
      market_prices: MarketPrice.all 
    }
  end

  # POST /trade (buy)
  def create
    symbol = params[:symbol]   
    amount = params[:amount].to_f
    
    user = User.find_by(id: 1)
    
    if user.nil?
      render json: { error: "User not found" }, status: 404
      return
    end

    price_record = MarketPrice.find_by(symbol: symbol)
    
    if price_record.nil?
      render json: { error: "Invalid symbol" }, status: 400
      return
    end
    
    current_price = price_record.price_usd
    total_cost = current_price * amount

    if user.balance_usd < total_cost
      render json: { error: "Not enough money" }, status: 400
      return
    end

    ActiveRecord::Base.transaction do
      user.balance_usd = user.balance_usd - total_cost
      user.save!

      asset = Asset.find_by(user_id: user.id, symbol: symbol)
      
      if asset
        asset.cost_basis_usd = (asset.cost_basis_usd || 0) + total_cost
        asset.amount = asset.amount + amount
        asset.save!
      else
        Asset.create!(user_id: user.id, symbol: symbol, amount: amount, cost_basis_usd: total_cost)
      end
    end

    render json: { message: "Trade Successful!", new_balance: user.balance_usd }
  end

  # POST /sell
  def sell
    symbol = params[:symbol]   
    amount = params[:amount].to_f
    
    user = User.find_by(id: 1)
    
    if user.nil?
      render json: { error: "User not found" }, status: 404
      return
    end

    price_record = MarketPrice.find_by(symbol: symbol)
    
    if price_record.nil?
      render json: { error: "Invalid symbol" }, status: 400
      return
    end

    asset = Asset.find_by(user_id: user.id, symbol: symbol)
    
    if asset.nil? || asset.amount < amount
      render json: { error: "Not enough coins to sell" }, status: 400
      return
    end
    
    current_price = price_record.price_usd
    total_value = current_price * amount

    ActiveRecord::Base.transaction do
      user.balance_usd = user.balance_usd + total_value
      user.save!

      # Reduce cost basis proportionally
      cost_reduction = (amount / asset.amount) * (asset.cost_basis_usd || 0)
      asset.amount = asset.amount - amount
      asset.cost_basis_usd = (asset.cost_basis_usd || 0) - cost_reduction
      
      if asset.amount == 0
        asset.destroy!
      else
        asset.save!
      end
    end

    render json: { message: "Sold Successfully!", new_balance: user.balance_usd }
  end

  # POST /reset
  def reset
    starting_balance = params[:starting_balance].to_f
    
    if starting_balance <= 0
      render json: { error: "Starting balance must be greater than 0" }, status: 400
      return
    end

    user = User.find_by(id: 1)
    
    if user.nil?
      render json: { error: "User not found" }, status: 404
      return
    end

    ActiveRecord::Base.transaction do
      # Clear all positions
      Asset.where(user_id: user.id).destroy_all
      
      # Reset balance and starting balance to new amount
      user.balance_usd = starting_balance
      user.starting_balance = starting_balance
      user.save!
    end

    render json: { message: "Portfolio reset!", starting_balance: starting_balance }
  end
end