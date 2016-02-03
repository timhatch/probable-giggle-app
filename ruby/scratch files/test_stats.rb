# Test Sequel / PostgresSQL
Dir.chdir("/users/timhatch/sites/flashresults/ruby")

require 'json'
require 'pg'
require 'sequel'

#
# address format for a non-passwork protected BD "postgres://[user]@localhost:5432/[name]"
# address format for a passwork protected BD "postgres://[user][:password]@localhost:5432/[name]"
#
DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
DB.extension :pg_array      # Needed to insert arrays
Sequel.extension :pg_array_ops  # Needed to query stored arrays

params = { wet_id: 1584, route: 3, grp_id: 5 }

def set_ranking_from_table table, sort_key
  table
  .select(:start_order, sort_key, :rank_prev_heat)
  .select_more{rank.function
  .over(order: [
    Sequel.desc(Sequel.pg_array_op(sort_key)[1]),
    Sequel.pg_array_op(sort_key)[2],
    Sequel.desc(Sequel.pg_array_op(sort_key)[3]),
    Sequel.pg_array_op(sort_key)[3],
    :rank_prev_heat
  ])}
  .all
end

def project_results results, kind, sort_key, base_key
  results.each do |result|
    DB[:Forecast]
    .where(start_order: result[:start_order])
    .update(sort_values: Sequel.pg_array(result[sort_key]))
  
    # CHECK RESULT
    puts "STEP 2: Check updated temporary sorting table for person #{result[:per_id]}"
    p  DB[:Forecast].where(start_order: result[:start_order]).first
    puts "\n\n"
    
    # Rankn the resylts in the 
    forecast_ranks = set_ranking_from_table(DB[:Forecast], :sort_values)
  
    # CHECK RESULT
    puts "STEP 3: Check forecast rank for person #{result[:per_id]}" 
    p forecast_ranks
    puts "\n\n"
    
    result[kind] = forecast_ranks.to_a
                            .select { |a| a[:start_order] == result[:start_order] }
                            .first[:rank]
  
    # CHECK RESULT
    puts "STEP 4: Check stored result for person #{result[:per_id]}" 
    p result
    puts "\n\n"
  
    DB[:Forecast]
    .where(start_order: result[:start_order])
    .update(sort_values: Sequel.pg_array(result[base_key]))
  end
end

def forecast_best_result results
  # TODO Set this dynamically:
  boulder_n = 4
  
  results.map do |result|
    b_completed  = JSON.parse(result.delete(:result_json)).length
    forecast_best_result = Array.new(4, boulder_n - b_completed)
    forecast_best_result.map.with_index { |x,i| forecast_best_result[i] += result[:sort_values][i] }
    #result[:best_values] = forecast_best_result
    result.merge({ best_values: forecast_best_result })
  end
end
# Fetch the default Ranking data
# NOTE Can remove :per_id as it is used here only for debugging (or replace :start_order)
dataset = DB[:Ranking]
.select(:per_id, :start_order, :result_rank, :sort_values, :rank_prev_heat, :result_json)
.where(params)
.exclude(sort_values: nil)
# Insert the default ranking data into
#DB.create_table! :Forecast, { as: dataset, temp: true }
#DB.create_table! :Forecast, { as: dataset }
DB.create_table! :Forecast, { as: dataset, temp: true }

test_array =  forecast_best_result(dataset.all)

# CHECK RESULT
puts "STEP 1: Check input result and calculated \"best\" result"
p test_array
puts "\n\n"


project_results(test_array, :best, :best_values, :sort_values)

# Rebuild the DB[:Forecast] db
test_array.each do |result|
  DB[:Forecast]
  .where(start_order: result[:start_order])
  .update(sort_values: Sequel.pg_array(result[:best_values]))

  # CHECK RESULT
  puts "STEP 5: Check updated temporary sorting table for person #{result[:per_id]}"
  p  DB[:Forecast].where(start_order: result[:start_order]).first
  puts "\n\n"
end

project_results(test_array, :worst, :sort_values, :best_values)
  
test_array.each { |x| p x }




#p data = DB[:Ranking]
#  .select(:per_id, :lastname, :firstname, :result_rank, :result_json, :sort_values, :rank_prev_heat)
#  .where(params)
#  .order(:per_id)
#  .all
#
#all_starters = data.length
#puts "\n\n"
#
## Count the number of non-starters and remove them
#p data.delete_if { |x| x[:sort_values].nil? }
#p non_starters = all_starters - data.length
#
## Convert the result_json parameter into something useful
#p data.each { |r| r[:completed] = JSON.parse(r.delete(:result_json)).length }
#puts "\n\n"
#
## TODO: Set this by querying the Competition table
#boulder_n = 4
#
#p base_results = data.map { |result| result[:sort_values] << result[:rank_prev_heat] }
#
#data.each do |result|
#  best_forecast = Array.new(4, boulder_n - result[:completed])
#  best_forecast.map.with_index { |x,i| best_forecast[i] += result[:sort_values][i] }
#  best_forecast << result[:rank_prev_heat] 
#  p best_forecast
#end
#completed = result[:completed]

#p data


#p data.sort! { |x,y| [ y[:sort_values][0], x[:sort_values][1],y[:sort_values][2], x[:sort_values][3]] <=> [ x[:sort_values][0], y[:sort_values][1],x[:sort_values][2], y[:sort_values][3]] }
# Sore the 
def ifsc_sort x, y
  [ 
    y[:sort_values][0],x[:sort_values][1],y[:sort_values][2],x[:sort_values][3]
  ] <=> [ 
    x[:sort_values][0],y[:sort_values][1],x[:sort_values][2],y[:sort_values][3]
  ]
end
#p data.sort! {  |x,y| ifsc_sort(x,y) }
#sorted = data.sort do |l,r|
#  x = l[:sort_values]
#  y = r[:sort_values]
#  [y[0],x[1],y[2],x[3]] <=> [y[0],x[1],y[2],x[3]]
#end
#p sorted
# Strip out anyone who hasn't yet started

#current_result = data.map { |person| { per_id: person[:per_id], sort_values: person[:sort_values] }}
#p current_result



#p data.sort { |a| a[:sort_values][1].to_i }



#data.each do |person|
#  p person[:lastname]
#  p person[:result_json]
#  #current_result = person[:sort_values]
#  p JSON.parse(person[:result_json]).length
#end



# Test
#params = { boulder: 4, wet_id: 1, route: 2, grp_id: 5 }
#p who_topped params

# Get ranking data by operating on a pre-ranked view
def test_view params
  DB[:Ranking]
    .where(params)
    .select(:PerId,:lastname,:firstname,:nation,:result_rank,:result,:result_json,:rank_prev_heat)
    .all
end

def create_uuid params
  ruid = {}
  if params.has_key?(:wet_id) then ruid[:wet_id] = params.delete(:wet_id) end
  if params.has_key?(:grp_id) then ruid[:grp_id] = params.delete(:grp_id) end
  if params.has_key?(:route) then ruid[:route] = params.delete(:route) end
  ruid
end
  
# Get ranking data by calling a window funtion
def test_window params
  round   = create_uuid params
  dataset = DB[:Ranking]
    .where(round)
    .select(:wet_id, :grp_id, :route, :lastname)
    .select_append{rank.function.over(
      :partition => [:wet_id, :grp_id, :route],
      :order => [
        Sequel.desc(:rank_param), 
        Sequel.asc(:rank_prev_heat)
      ])
      .as(:result_rank)
    }
  dataset.where(params).all
end