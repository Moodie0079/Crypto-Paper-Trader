# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_08_010100) do
  create_table "assets", id: :integer, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.decimal "amount", precision: 18, scale: 8, default: "0.0", null: false
    t.decimal "cost_basis_usd", precision: 18, scale: 2, default: "0.0"
    t.string "symbol", limit: 10, null: false
    t.integer "user_id", null: false
    t.index ["user_id", "symbol"], name: "user_asset_idx", unique: true
  end

  create_table "market_prices", primary_key: "symbol", id: { type: :string, limit: 10 }, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.decimal "price_usd", precision: 18, scale: 2, null: false
    t.timestamp "updated_at", default: -> { "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
  end

  create_table "users", id: :integer, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.decimal "balance_usd", precision: 18, scale: 2, default: "100000.0"
    t.timestamp "created_at", default: -> { "CURRENT_TIMESTAMP" }
    t.string "email", null: false
    t.decimal "starting_balance", precision: 18, scale: 2, default: "100000.0"
  end

  add_foreign_key "assets", "users", name: "assets_ibfk_1"
end
