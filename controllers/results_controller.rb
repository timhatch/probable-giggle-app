# Module  Perseus             - The namespace for all application code
# Class   ResultsController   - Subclasses ApplicationController
#
# ResultsController manages routes Requesting/Updating/Deleting results in the
# database
# Currently implements:
# - Getting/Setting a single result (i.e. for one climber and one boulder)
#   (In theory the relevant method in LocalDBConnection will cope with multiple boulders being
#   updated but the corresponding eGroupware method has not been implemented
# - Getting multiple results (e.g. for all climbers in a round)
#
module Perseus
  class ResultsController < Perseus::ApplicationController
    # HELPERS
    helpers Perseus::ResultsHandler

    # symbolize route parameters (deliberately non-recursive)
    # FIXME: Not sure this actually works... sinatra has some kind of indifferent access going on
    # under the hood
    before do
      params.keys.each { |k| params[k.to_sym] = params.delete(k) }
      # params.transform_keys!(&:to_sym)
    end

    # Fetch either __multiple__ or (if either per_id or start_order are given) a __single__ result
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection::Results.fetch
    # Returns either an array of results or a single result as appropriate
    fetch = -> { LocalDBConnection::Results.fetch(params).to_json }

    # Handle either a generic GET request or one with a per_id sub-route
    get '/', &fetch
    get '/:per_id', &fetch

    # Update a __single__ result
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection.set_result_single
    put '/person' do
      if LocalDBConnection::Results.update_single(params)
        ResultsHandler.broadcast_results(params) ? 200 : 501
      end
    end

    # Lock or unlock results for a complete route to disable/enable editing
    put '/lock' do
      LocalDBConnection::Results.lock(params) ? 200 : 501
    end

    # Reset one or more resulta
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection::Results.reset
    delete '/reset' do
      LocalDBConnection::Results.reset(params)
      ResultsHandler.broadcast_route(params) ? 200 : 501
    end

    # Delete one or more resulta
    delete '/delete' do
      LocalDBConnection::Results.delete(params) ? 200 : 501
    end

    # Delete any results in the broadcast pipeline
    delete '/broadcast' do
      ResultsHandler.purge_eventstream ? 200 : 501
    end
  end
end