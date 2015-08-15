/*  MVC style coding for a dynamic presentation of bouldering results
* Copyright 2011, Tim Hatch
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/**********************************************************
* CODEKIT DECLARATIONS
*
***********************************/
/*global Backbone */
/*global _        */
/*global App      */

window.App = window.App || {}

/**********************************************************
* ResultsList extending Backbone.js 'Collection' class
**********************************************************/

App.ResultsList = Backbone.Collection.extend({
  url       : './scripts/getJSON.php',
  model     : App.Climber,

  /*
  * initialize()
  *
  * NOTE: Mandatory input parameter is a reference to the application settings model (options.settings)
  * NOTE: Optional input parameters are the round and category for display
  *
  */
  initialize: function(options){
    this.cat      = options.cat || 'm'
  },

  /*
  * loadResults(): Get startlist data from the server
  *
  * Return a bespoke $.deferred instead of simply passing through the $.deferred returned by the $.getJSON call.
  * This allows us to work around the possibility that $.getJSON may return a 404 if (for example) one of the specified Starting Groups does not exist.
  *
  */
  loadResults: function() {
    var url  = this.url+'?cat='+this.cat,
      $rsp = $.Deferred(),
      $xhr = $.getJSON(url),
      self = this

    $xhr.success(function(data){
      self.reset(data)            // Create a set of models from the edited 'participants' object
      $rsp.resolve(true)            // Resolve the Deferred and pass true for a successful query
    })
    $xhr.error(function(){
      $rsp.resolve(false)           // Resolve the Deferred and pass false for an unsuccessful query
    })
    return $rsp
  },

  /*
  * update(): Get startlist data from the server
  *
  * Uses the same methodology as loadResults() to get around $.getJSON returning a $.deferred with fail status
  *
  */
  update: function(){
    var url  = this.url+'?cat='+this.cat,
      $rsp = $.Deferred(),
      $xhr = $.getJSON(url),
      self = this

    $xhr.success(function(data){
//      window.console.log(data)
      self.setResults(data)         // Calculate and set the results data for each climber (model)
      $rsp.resolve(true)
    })
    $xhr.error(function(){
      $rsp.resolve(false)
    })
    return $rsp
  },

  setResults: function(data) {
    var model
    _(data).each(function(person){
      model = this.get(person.id)
      model.set({ 'points': person.points, 'bonus': person.bonus, 'rank': person.rank })
    }, this)
  }
  
})

/**********************************************************
 * ResultsList view extending Backbone.js 'View' class
**********************************************************/

App.ResultsListView = Backbone.View.extend({
  $resultsView  : null,
  currentView   : null,
  className   : 'resultslistview',

  /*
  * initialize() : Create the containing view for the collection of individual model views
  * The view is initialized by passing the following options:
  *
  * !Important - The backbone options parameter is used to allow the view to reference the application settings
  *
  */
  initialize: function(options){
    var self = this

    self.loadResults(options.cat)
    setInterval(function(){
      self.updateView({ 'force_refresh' : true })
    }, 5000)

  },

  /*
  * loadResults(): Populate the results collections and render the related subviews into 
  * the main view
  */
  loadResults: function(cat){
    var subview,
      $response,
      $deferreds  = [],
      self    = this

    // Pre-render the view container & initialise the collections containing the results
    this.initViewContainer(cat)

    // Fetch results from the server for each collection
    // We return a bespoke $.deferred object from the $.ajax call and create views if that $.deferred returns true
    _(this.resultslists).each(function(collection){
      $response = collection.loadResults()
      $.when($response).done(function(bool){
        // If the collection's loadResults() function returns 'true' (i.e. the collection's getJSON returned data, create and append a subview for each climber)
        if (bool) {
          collection.each(function(model){
            subview =  new App.ClimberView({ model : model })
            self.climberviews.push(subview)
            self.$resultsView.append(subview.render().el)
            // NOTE: Now that we've created the model views, we can update the view to show results
            subview.update()
          })
        }
      })
      $deferreds.push($response)
    })

    // When all $deferreds have completed (i.e. when we have rendered all subviews), initialize $.isotope and call update() to sort/filter the view
    $.when.apply(null, $deferreds).done(function(){

      // Initialise isotope for elements of kind 'li'
      self.$resultsView.isotope({
        itemSelector  : 'li',
        getSortData   : {
          rankorder: function($el){ return parseInt( $el.data('rankorder'), 10) }
        }
      })
      self.updateView()
    })
  },

  /*
  * initViewContainer(): Create the results collections & call the main view render function
  */
  initViewContainer: function(cat){

    // Create an array of ResultsLists objects (collections) & set up the variables for the first object to be fetched
    this.resultslists = []

    // Push two collections onto the array for the selected round, either M+F or both Starting Groups for the selected category in Q
    this.resultslists.push(new App.ResultsList({ 'cat' : cat }))
    // this.resultslists.push(new App.ResultsList({ 'cat' : cat+'j' }))

    // Pre-render the view container
    this.render()
  },

  /*
  * render(): Render the view container
  */
  render: function(){
    var str = '<ul></ul>'

    // Clean up any existing views if render is being called other than the first time
    if (this.currentView) { this.close() }
    this.climberviews = []

    // Create the shell of the view.
    this.$el.html(str)
    this.$resultsView = this.$('ul')  // Cache the resultslist view

    // Append the view to the DOM
    $('#wrapper').prepend(this.el)

    // Create a reference to the current view
    this.currentView = this
  },

  /*
  * updateView(): Order the displayed results
  *
  * Takes an optional parameter to force a refresh of the collection data
  *
  */
  updateView: function(options){
    var $response,
      $deferreds  = [],
      self    = this

    // If force_refresh == true, then get new results from the server
    options || (options = {})

    if (options.force_refresh) {
      _(this.resultslists).each(function(collection){
        $response = collection.update()
        $deferreds.push($response)
      }, this)
    }

    // But in all cases, apply the $.isotope filters to perform the visual sort
    $.when.apply(null, $deferreds).done(function(){

      // Set the default css properties & set the $.isotope filter based on the current application settings
      var cssProperty = 'visible'

      // Call the $.isotope updateSortDate() method on the li elements in the view
      // We need to do this as the parameter 'rankorder' will have changed since $.isotope was initialized
      self.$resultsView.isotope( 'updateSortData', self.$('li'))

      // Call the $.isotope sortBy() method using rankorder as the sorting parameter and apply filters to show the top 'n' and to rotate through the remainder
      self.$resultsView.isotope({ 'sortBy': 'rankorder' })
    })
  }
})