# Checks if user exists if not creates one.
if User.count == 0
    User.create(email: "test@gmail.com", balance_usd: 100000.00)
    puts "Created Test User"
  else
    puts "User already exists"
  end