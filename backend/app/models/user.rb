class User < ApplicationRecord
    has_many :assets
  
    # Prevents from saving a user if their balance is negative.
    validates :balance_usd, numericality: { greater_than_or_equal_to: 0 }
  end