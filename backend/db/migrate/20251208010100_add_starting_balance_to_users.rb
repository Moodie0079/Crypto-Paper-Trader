class AddStartingBalanceToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :starting_balance, :decimal, precision: 18, scale: 2, default: 100000.00
  end
end
