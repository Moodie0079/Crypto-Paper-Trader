class FixCostBasisPrecision < ActiveRecord::Migration[8.1]
  def change
    change_column :assets, :cost_basis_usd, :decimal, precision: 18, scale: 2, default: 0.00
  end
end
