Rails.application.routes.draw do
  get '/portfolio', to: 'trades#index'
  post '/trade', to: 'trades#create'
  post '/sell', to: 'trades#sell'
  post '/reset', to: 'trades#reset'
end