/***********************************
*
*	CODEKIT DECLARATIONS
*
***********************************/
/*global Backbone */
/*global _        */
/*global App      */

// Use a Mustache syntax within underscore's templating mechanism
_.templateSettings = {
	evaluate : /\{\[([\s\S]+?)\]\}/g,
	interpolate : /\{\{([\s\S]+?)\}\}/g
};

window.App = window.App || {}

/* Basic bloc model */
App.Bloc = Backbone.Model.extend({

	/* Inherited properties */
	resmx		: [10, 7, 4, 1, 0],
	defaults: {
		state	: 4,					// check state
		score	: 0,
		bonus	: 0
	},

	/*
	* Set the score and bonus attributes
	*
	*/
	setResult: function(i){
		i = parseInt(i,10)
		this.attributes.score = (i < 3) ? this.resmx[i] : 0
		this.attributes.bonus = (i < 4) ? 1 : 0

		// Update the state variable - using set() fires a change event where this.attributes.state = i; would not
		this.set({"state" : i})
	}
});

/* Basic bloc entry view */
// TODO: Currently drafted to use '1' as the entry value for a 'bonus' - may need to change this to allow 'b' to be used...
App.BlocView = Backbone.View.extend({
	tagName		: "div",
	className	: "tile",
	tmpl		: _.template($('#boulder_tmpl').html()),
	model		: App.Bloc,
	events		: {
		"change input[type=text]"  : "updateFromText", // simpler than checking for return and tab or '0' entries
		"click  input[type=radio]" : "updateFromRdio"
	},

	/*
	* Initialise the view and its related model
	*
	*/
	initialize: function(){
		//	Disable highlighting of parent element to a clickable region in Android Mobile Webkit
		this.$el.css('-webkit-tap-highlight-color','rgba(0,0,0,0)')

		// Bind the change event of this.model to this.update()
		this.listenTo(this.model, 'change', this.update, this)
	},

	/*
	* Render the view
	*
	*/
	render: function(){
		this.$el.html(this.tmpl({ id : this.model.get('id') }))
		this.update()
		return this
	},

	/*
	* Update the model from a textfield entry or radiobutton hit
	*
	*/
	updateFromRdio: function(){
		var i = this.$el.find("input[type:radio]:checked").val()
		//	Note that typedef(i) == string
		this.model.setResult(i)
	},

	/*
	*
	*
	*/
	updateFromText: function(){
		// Get the value of the textfield and set the model 'state'
		var $el			= this.$el.find(':text'),
			text		= $el.val(),
			new_state	= (!text) ? 4 : _(this.model.resmx).indexOf(parseInt(text,10))

		// Strip out any '0's & flag invalid inputs & set the state so that they're ignored for the purposes of calculating the score
		if (text == '0') $el.val('')
		if (new_state > -1) { $el.removeClass('error') } else { $el.addClass('error'); new_state = 4 }

		// Update the model
		this.model.setResult(new_state)
	},

	/*
	* Synchronise the view and model states
	*
	*/
	update: function(){ // DEBUG: window.console.log('now in update')
		var i = this.model.get("state"),
			j = (i < 4) ? this.model.resmx[i] : null

		// sync the text and radio states
		this.$el.find(":radio")[i].checked = true
		this.$el.find(':text').val(j).toggleClass('gtext', (i > 2) && (j != null))

		// add visual cues
		this.$el.toggleClass('bg-color-blueDark', (i<4))	// this.$el.toggleClass('bg-color-blueDark', (i<3)).toggleClass('bg-color-blueLight', (i==3))
	}
});


/* Model Collection */
App.Result = Backbone.Collection.extend({
	identity	: {
		"PerId"		: null,
		"name"		:"name",
		"code"		: null,
		"category"	:"m"
	},
	score		: 0,
	bonus		: 0,
	model		: App.Bloc,

	/*
	* Instantiate a collection of models
	*
	*/
	initialize: function(){
		// Bind change events (bubbled up from any change to a model) to this.setResult()
		this.on('change', this.setResult, this)
	},

	/*
	* Populate the collection
	*
	*/
	populate: function(n){
		while (n) { this.add(new App.Bloc({ "id" : 'b'+n })); n-- }
		return this
	},

	/*
	* Get Collection data from the server
	*
	*/
	load: function(text){
		var self =  this
		$.getJSON("./scripts/get.php", {"PerId" : text}, function(data){
			// Update the collection identity data
			self.identity = data.identity
			self.trigger('change:title') // Trigger a specific change to deal with only the identity changing
			// Update the models (no change event will be fired if the data isn't actually changed)
			_(self.models).each(function(model){
				var i = model.get('id')
				model.setResult(data.results[i])
			})
		})
	},

	/*
	* Set the aggregate result
	*
	*/
	setResult: function(){
		this.score = this.bonus = 0
		_(this.models).each(function(model){
			this.score += model.get("score")
			this.bonus += model.get("bonus")
		}, this)
	},

	/*
	* Post Results to server
	*
	*/
	post: function(){
		$.post("./scripts/post.php", {
				"PerId" : this.identity.PerId,
				"models": JSON.stringify(this)
			}, function(data){
			/* as a test, write-back the data received at the server */
			window.console.log(data)
		})
	}
});

/* App container */
App.MainView = Backbone.View.extend({
	el			: $('#inner'),
	events		: {
		"blur     #PerId"  : "tabResult",
		"keypress #PerId"  : "loadResult",
		"click    #submit" : "postResult"
	},
	blocs		: 30,

	/*
	* Initialize() : Init the view
	*
	*/
	initialize: function(options){
		var view,
			$el	= this.$el.find('#tiles'),
			n	= options.blocs || this.blocs

		// Bootstrap the collection's models & create the relevant views
		this.collection = new App.Result()
		this.collection.populate(n).each(function(model){
			view = new App.BlocView({ "model": model })
			$el.prepend(view.render().el)
		})

		// Bind the change and change:title event of this.collection to this.update()
		this.listenTo(this.collection, 'change', this.update, this)
		this.listenTo(this.collection, 'change:title', this.update, this)
	},

	/*
	*
	*
	*/
	tabResult: function(){
		var text = $("#PerId").val()	//	OR: var text = this.$el.find("#PerId").val() || var text = this.$('#PerId').val()
		if (!text) return
		this.collection.load(text)
	},

	/*
	* Load data for the identified climber
	*
	*/
	loadResult: function(e){
        // Deal with keypress events in the input field
		var text = $("#PerId").val()	//	OR: var text = this.$el.find("#PerId").val();
        if (!text || e.keyCode != 13) return	// Ignore (b) anything that is not a ENTER key (13); or (a) an ENTER key if there is no text

		// TODO: Maybe amend this so that we can enter either a surname or PerId???

		// Load collection data from the server
		this.collection.load(text)
	},

	/*
	* Respond to a submit event by calling the relevant collection function
	*
	*/
	postResult: function(){
		this.collection.post()
	},

	/*
	* Update the Identity display
	*
	*/
	update: function(){
		// Update the identity data - NOTE: May wish to separate this into a different function
		this.$("#name").html(this.collection.identity.name)
		this.$("#ctgy").html('('+(this.collection.identity.category).toUpperCase()+')')
		// Update the results field
		this.$("#rslt").text(this.collection.score+' / '+this.collection.bonus)
	}
});

$(document).ready(function(){
	new App.MainView({ 'blocs' : 30 })
});