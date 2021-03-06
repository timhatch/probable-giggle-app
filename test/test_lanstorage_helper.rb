
require 'test/unit'
require_relative '../helpers/lanstorage_helper.rb'

class Session < Test::Unit::TestCase
  include Perseus::LocalDBConnection

  def test_reset
    Session.reset
    resp0 = DB[:Session].first
    assert_equal({ wet_id: nil, auth: nil }, resp0)
  end
  
  # Test the Perseus::EGroupwarePublicAPI.capitalize_params method
  def test_data
    # Expected Output
    resp6 = DB[:Session].first
    assert_equal(resp6, Session.get)
  end
end

class Competition < Test::Unit::TestCase
  include Perseus::LocalDBConnection

  def test_active
    current_competition = DB[:Competitions]
                          .join(:Session, [:wet_id])
                          .first
    assert_equal(current_competition, Competition.active)
  end

  def test_insert
    comp            = { wet_id: 999 }
    expected_result = { wet_id: 0, city: 'Längenfeld', date: '2017-01-01', type: 'B',
                        title: 'Test Competition' }.merge(comp)
    Competition.insert(comp)
    actual_result   = DB[:Competitions].where(comp).first
    assert_equal(actual_result, expected_result)
  end
end

class Competitors < Test::Unit::TestCase
  include Perseus::LocalDBConnection

  def test_query
    test_result = DB[:Climbers].where(per_id: 1030).first
    assert_equal(test_result, Competitors.query('PerId' => 1030).first)
  end

  def test_insert
    test_array  = [{ 'per_id' => 1_000_000, 'lastname' => 'test' }]
    Competitors.insert(test_array)
    check_result = DB[:Climbers].where(per_id: 1_000_000).first
    check_result.keep_if { |_k, v| !v.nil? }
    test_result = { per_id: 1_000_000, lastname: 'test', birthyear: 0 }
    assert_equal(test_result, check_result)
  end
end
