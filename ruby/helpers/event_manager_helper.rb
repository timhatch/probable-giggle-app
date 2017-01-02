
# Module  Perseus                 - The namespace for all application code
# Module  ResultsHandler          - Helper methods to handle resultss
#
require 'httparty'
require 'json'
require 'date'

# NOTE: This require statement is needed for stand-alone testing. It may not be needed when
#   this module is called from a running Sinatra application as all helper modules are included
#   through config.ru
require_relative './lanstorage_helper'

# NOTE: To test event streams, we'll can use curl
#   curl -v --request GET -H "Accept: text/event-stream" http://10.0.2.10/broadcast/result
#   sets up a terminal based event source receiver connected to the test server. Bonjour /
#   zeroconf is not reliable
#   We can send test messages using either curl, httpie or httpary:
#   (httpie)    http POST http://10.0.2.10/broadcast/result message='hello tim'
#   (httparty)  httparty http://10.0.2.10/broadast/result --action POST --data "hello again"

module Perseus
  module ResultsHandler
    # Localhost receiver
    @default_url = 'http://10.0.2.10'

    private_class_method

    # Broadcast a result to localhost
    def self.broadcast_to_localhost path, data
      url     = @default_url + path
      options = { body: data.to_json }
      HTTParty.post(url, options)
    rescue
      puts 'Exception raised in ResultsHandler.broadcast_to_localhost'
      nil
    end

    # Broadcast the received result to eGroupware
    def self.broadcast_to_egroupware data
      auth = LocalDBConnection.get_session_data[:auth]
      EGroupwarePrivateAPI.ranking_boulder_measurement(auth, data) unless auth.nil?
    rescue
      puts 'Exception raised in ResultsHandler.broadcast_to_egroupware'
      nil
    end

    # Broadcast results to localhost and egroupware
    def self.broadcast_results params
      return 0 unless Perseus::LocalDBConnection::Results.result_person(params)

      # REVIEW: Technically we need only broadcast the pverall result when a bpnus or
      #   top has been gained, but there's no obvious way to determine that.
      # Use the endpoint /broadcast/result for the results display stream
      updated_route_result = Perseus::LocalDBConnection::Results.result_route(params)
      broadcast_to_localhost('/broadcast/result', updated_route_result)
      # Get the individual result
      updated_person_result = updated_route_result
                              .select { |x| x[:per_id] == params[:per_id] }
                              .first
                              .merge(result_jsonb: params[:result_jsonb])
      # Use the endpoint /broadcast/stream for the live output stream
      broadcast_to_localhost('/broadcast/stream', updated_person_result)
      # HACK: Put the eGroupware call into a separate thread to avoid blocking
      #   Not sure whether this is the best place to spawn a new thread
      # Thread.new { broadcast_to_egroupware(updated_person_result) }
    end

    module_function

    # Handle a results update coming into the local server
    def handle_result_single params
      # Update the local server
      LocalDBConnection::Results.update_single(params)
      broadcast_results(params)
    end
  end
end