/***********************************
* CODEKIT DECLARATIONS
***********************************/

/* global _        */
/* global Backbone */
/* global App      */
/* global Promise  */

/* @codekit-prepend "promise-1.0.0.min.js" */

// Use a Mustache syntax within underscore's templating mechanism
_.templateSettings = {
  evaluate : /\{\[([\s\S]+?)\]\}/g,
  interpolate : /\{\{([\s\S]+?)\}\}/g
}

window.App    = window.App || {}
Backbone.View = Backbone.NativeView
App.AjaxMixin = {
  /*
  * ajaxRequest(): Really simple Promises A inclined XMLHttpRequest
  * Parameters:
  *   type = 'GET' or 'POST'.
  *   url  = The url target. For 'GET' requests this includes any query parameters. For 
  *   'POST' requests it will be the base url only.
  *   data = (not used for 'GET' requests) the data to be 'posted'.
  * Example:
  *   GET request:  this.ajaxRequest('GET', url)
  *   POST request: this.ajaxRequest('POST', url, data)
  *
  * NOTE: This function will not respect redirects
  * NOTE: Requires that the server-script returns a JSON-encoded response
  */
  ajaxRequest: function(type, url, data){

    return new Promise(function(resolve, reject){
      var client  = new XMLHttpRequest(),
      handler = function(){
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(JSON.parse(this.response))
          } else {
            reject(this)
          }
        }
      }

    client.open(type, url)
    client.onreadystatechange = handler
    client.setRequestHeader('Accept', 'application/json')
    if (type === 'POST') {
      client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    }
    client.send(data)
    })
  }
}

/**********************************************************
* Boulder model extending Backbone.js 'Model' class
**********************************************************/

App.Bloc = Backbone.Model.extend({
  /* Inherited properties */
  resmx    : [10, 7, 4, 1, 0],
  defaults : {
    result : null,
    score  : 0,
    bonus  : 0
  },
  
  initialize: function(){ this.on('change', this.parseResult, this) },
    
	parseResult: function(){
    // window.console.log('in parseResult')
    var B, T
		B  = this.attributes.result.match("b[0-9]{1,}") || null
		B  = B ? parseInt(B[0].slice(1),10) : null
		T  = this.attributes.result.match("t[0-9]{1,}") || null
		T  = T ? parseInt(T[0].slice(1),10) : null

    this.attributes.bonus = (B || T) ? 1 : 0
    this.attributes.score = (T) ? this.resmx[T - 1] : 0
    //window.console.log(this)
  }
})

/**********************************************************
* Boulder view extending Backbone.js 'View' class
**********************************************************/

App.BlocView = Backbone.View.extend({
  tagName   : 'div',
  className : 'tile',
  model     : App.Bloc,
  events    : {
    // "click  input[type=radio]" : "updateFromRdio",
    "change input[type=text]"  : 'updateFromText'
  },

  /*
  * initialize(): Bind the change event of this.model to this.update()
  */
  initialize: function(){ this.listenTo(this.model, 'change', this.renderState, this) },

  /*
  * Render the view from its template
  */
  render: function(){
    var templateFunc  = _.template(document.getElementById('boulder_tmpl').textContent)
    this.el.innerHTML = templateFunc({ id : this.model.get('id') })

    // Create a reference to the data entry and status indicator elements
    this.textCell = this.el.querySelector('input[type="text"]')
    this.nodeList = this.el.getElementsByClassName('flag')

    this.renderState()
    return this
  },

  /*
  * updateFromText() : Update the score from data entered using the keyboard
  */
  updateFromText: function(){
    var s = (!!this.textCell.value) ? parseInt(this.textCell.value,10) : null   
    this._setStateIndicators(s)
  },

  /*
  * Synchronise the view and model states
  */
  renderState: function(){
    var s = this.model.get('score') || this.model.get('bonus')
    this._setStateIndicators(s)
  },
  
  _setStateIndicators: function(x){
    var i = _(this.model.resmx).indexOf(x)
    
    this.textCell.value = x ? x : ''

    this.textCell.classList.remove('error')
    _(this.nodeList).each(function(el){ el.classList.remove('noerror', 'error') })

    switch (i) {
    case -1:
      this.textCell.classList.add('error') //; window.console.log('do nothing')
      break;
    case 4:
      this.model.set({ 'result' : '' }) //; window.console.log('do nothing')
      break;
    case 3:
      this.model.set({ 'result' : 'b1' })
      this.nodeList[i].classList.add('error')
      break;
    default:
      this.model.set({ 'result' : 't'+(i+1) })
      this.nodeList[i].classList.add('noerror')
    }
  }
})


/**********************************************************
* Collection of boulder models
**********************************************************/
/* Model Collection */
App.Result = Backbone.Collection.extend({
  model   : App.Bloc,

  /*
  * Instantiate a collection of models
  * Bind change events (bubbled up from any change to a model) to this.setResult()
  */
  initialize: function(){
    var n = 30
    while (n) { this.add(new App.Bloc({ "id": 'p'+n })); n-- }

    this.on('change', this.setResult, this)
  },

  /*
  * Get Collection data from the server
  */
  load: function(perid){
    var self = this
      , url  = '/climber?PerId='+perid
    
    this.ajaxRequest('GET', url)
    .then(function(data){
      if (!!data) {
        self._setIdentity(data)
        self._resetModels(data)        
      }
    })
    .catch(function(err){ window.console.log(err) })
  },

  _setIdentity: function(data){
    this.PerId    = data.PerId
    this.name     = data.Lastname +', '+data.Firstname[0] 
    this.category = data.Category
    this.trigger('change:competitor')      
  },
  
  _resetModels: function(data){
    // window.console.log('in _resetModels')
    var results = JSON.parse(data.ResString)
      , id, type
    
    _(this.models).each(function(model){
      id   = model.get('id')
      type = typeof results[id]

      model.set({ 'result' : (type === "string") ? results[id] : '' })
    })      
  },

  /*
  * Set the aggregate result
  */
  setResult: function(){
    this.points = this.bonuses = 0
    _(this.models).each(function(model){
      this.points  += model.get('score')
      this.bonuses += model.get('bonus')
    }, this)
  }
})
_.extend(App.Result.prototype, App.AjaxMixin)
/**********************************************************
  App container
**********************************************************/

App.ResultView = Backbone.View.extend({
  el     : document.getElementById('inner'),
  events : {
    "change input#perid"   : 'handleTabEvent',
    "click  button#submit" : 'postResult'
  },

  /*
  * Initialize() : Init the view
  */
  initialize: function(){
    var el = document.getElementById('tiles')
      , view

    // Cache the WetId parameter
    this.wetid = document.querySelector('.title').getAttribute('data-wetid')
    
    // Bootstrap the collection's models & create the relevant views
    this.collection = new App.Result()
    this.collection.each(function(model){
      view = new App.BlocView({ 'model': model })
      el.insertBefore(view.render().el, el.firstChild)
    })
        
    // Bind the change and change:competitor event of this.collection to this.update()
    this.listenTo(this.collection, 'change', this.renderState, this)
  },

  /*
  * Update the Identity & results fields
  */
  renderState: function(){
    document.getElementById('name').textContent   = this.collection.name
    document.getElementById('grpid').textContent  = this.collection.category
    document.getElementById('result').textContent = this.collection.points+'.'+this.collection.bonuses
  },

  /*
  * handleKeyPress() & handleTabEvent()
  * Respond only when the ENTER key is pressed or when the user tabs out of the cell
  */
  // handleKeyPress: function(e){ if (e.keyCode === 13) this.handleTabEvent() },
  handleTabEvent: function(){
    var val = document.getElementById('perid').value
    if (!!val) this.collection.load(val) 
  },

  /*
  * Respond to a submit event by calling the relevant collection function
  */
  postResult: function(){
    var obj = this.collection.filter(function(model){ return !!model.attributes.result  })
      , pid = 'PerId='+this.collection.PerId
      , wid = 'WetId='+this.wetid
      , qry = pid+'&'+wid+'&route=0&ResString='
      , tmp = {}
        
    _(obj).chain().sortBy('id').each(function(model){ 
      tmp[model.id] = model.get('result') 
    })
    qry += JSON.stringify(tmp)

    this.collection.ajaxRequest('POST', './test', qry)
    .then(function(response){ window.console.log('response is : '+response) })
  }
})