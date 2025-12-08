class AddCostBasisToAssets < ActiveRecord::Migration[8.1]
  def change
    add_column :assets, :cost_basis_usd, :decimal
  end
end
