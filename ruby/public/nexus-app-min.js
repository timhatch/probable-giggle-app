window.App=window.App||{},App.settingsVC={controller:function(t){this.ss=t,this.fetch=function(){for(var e in t)if(null===t[e])return;m.request({method:"GET",url:"/competition",data:{wet_id:t.WetId}}).then(function(e){try{var n=e.title||"-";n+=" / "+t.Route+" / "+t.GrpId+" / "+t.BlcNr,t.WetNm=n,t.State=!0,App.sessionStorage.set("AppState",t)}catch(s){window.console.log("invalid response : "+s)}App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})}},view:function(t){var e=t.ss;return m("div#settings",[m.component(App.ParamSV,e,{key:"WetId",text:"competition",pattern:"[0-9]"}),m.component(App.ParamSV,e,{key:"Route",text:"round"}),m.component(App.ParamSV,e,{key:"GrpId",text:"category"}),m.component(App.ParamSV,e,{key:"BlcNr",text:"boulder",pattern:"[0-9]"}),m("button.save",{type:"primary",outline:!0,upper:!0,onclick:t.fetch.bind(t)},"save")])}},App.ParamSV={controller:function(t,e){this.set=function(n){t[e.key]=n.toUpperCase()||null}},view:function(t,e,n){return m("div.modal",[m("label",n.text),m("input[type=text]",{onchange:m.withAttr("value",t.set.bind(t)),pattern:n.pattern||null,value:e[n.key]})])}},window.App=window.App||{},App.headerVC={controller:function(t){this.ss=t,this.toggleSettings=function(){for(var e in t)if(null===t[e])return;var n=t.State;t.State=n?!1:!0}},view:function(t){var e=t.ss;return m("header",{className:App.connectionStatus()?"connected":"disconnected"},[m("button",{onclick:t.toggleSettings,square:!0},m.trust("&#9776;")),m("span.details",e.WetNm||m.trust("&nbsp;"))])}},window.App=window.App||{},App.ResultsVC={controller:function(t){this.vm=t,this.changeAttempts=function(e){var n="swipedown"===e.type?1:-1,s=t.result.a+n;t.result.a=s>=0?s:0,t.save(),m.redraw(!0)}},view:function(t){var e=t.vm;return m("div#results",{config:m.touchHelper({swipedown:t.changeAttempts.bind(t),swipeup:t.changeAttempts.bind(t)})},[m.component(App.searchSV,e),m.component(App.attemptsSV,e,{text:"Tops"}),m.component(App.attemptsSV,e,{text:"Bonus"}),m.component(App.attemptsSV,e,{text:"Attempts"})])}},App.searchSV={controller:function(t){this.vm=t,this.incrementStarter=function(){var e=t.start_order+1;t.fetch(e)}},view:function(t){var e=t.vm;return m("div.search",[m("input[type=text]",{pattern:"[0-9]",onchange:m.withAttr("value",e.fetch.bind(e)),value:e.start_order}),m("span.details",e.fullname||m.trust("&nbsp;")),m("button",{square:!0,onclick:t.incrementStarter.bind(t)},m.trust("&#8594;"))])}},App.attemptsSV={controller:function(t,e){this.prop=e.text[0].toLowerCase(),this.changeValue=function(e){"swiperight"===e.type&&t.setResult(this.prop),"swipeleft"===e.type&&t.resetValues(this.prop),t.save(),m.redraw(!0)}},view:function(t,e,n){var s=e.result[t.prop];return m("div.row",{config:m.touchHelper({swiperight:t.changeValue.bind(t),swipeleft:t.changeValue.bind(t)})},[m("div.list",n.text),m("div.round",s?s:"-")])}},window.App=window.App||{},App.Person={start_order:null,fullname:null,resultJSON:{},composeURI:function(t){var e=App.sessionStorage.get("AppState"),n={Q:0,S:2,F:3},s={M:6,F:5,MJ:84,FJ:81,MA:82,FA:79,MB:83,FB:80};return{wet_id:parseInt(e.WetId,10),route:n[e.Route],grp_id:s[e.GrpId],start_order:parseInt(t,10)}},fetch:function(t){return t?m.request({method:"GET",url:"/climber",data:this.composeURI(t)},this).then(function(t){window.console.log(t);try{this.resultJSON=JSON.parse(t.result_json),this.fullname=t.lastname+", "+t.firstname,this.start_order=t.start_order}catch(e){window.console.log("in model.fetch, invalid response : "+e)}}.bind(this)):void 0},save:function(t){var e=this.composeURI(this.start_order);return e.result_json=t,m.request({method:"PUT",url:"/climber/bloc",data:e})},reset:function(){this.start_order=null,this.fullname=null,this.resultJSON={}}},window.App=window.App||{},App.VM=function(t){return{model:t,start_order:null,fullname:null,result:{a:null,b:null,t:null},setResult:function(t){this.result[t]||(this.result[t]=this.result.a,"t"!==t||this.result.b||(this.result.b=this.result.a))},resetValues:function(t){"a"!==t&&this.result[t]&&(this.result[t]=0)},serialise:function(){var t=App.sessionStorage.get("AppState"),e="p"+String(parseInt(t.BlcNr,10)),n={},s="";for(var r in this.result)this.result[r]&&(s+=r+this.result[r]);return n[e]=s,JSON.stringify(n)},fetch:function(e){var n=t.fetch(e);n.then(function(){var e=App.sessionStorage.get("AppState"),n=t.resultJSON,s="p"+String(parseInt(e.BlcNr,10));this.start_order=t.start_order,this.fullname=t.fullname;for(var r in this.result){var o=r+"[0-9]{1,}",i=n[s]?n[s].match(o):null;this.result[r]=i?parseInt(i[0].slice(1),10):null}}.bind(this)).then(function(){App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})},save:function(){var e=t.save(this.serialise());e.then(function(){App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})}}},window.App=window.App||{},App.connectionStatus=m.prop(!0),App.sessionStorage=mx.storage("session",mx.SESSION_STORAGE),App.SuperVC={controller:function(){var t={WetId:null,Route:null,GrpId:null,BlcNr:null,State:!1,WetNm:!1};this.ss=App.sessionStorage.get("AppState"),this.ss||(this.ss=t,App.sessionStorage.set("AppState",t)),this.person=App.Person,this.vm=App.VM(this.person)},view:function(t){var e=t.vm,n=t.ss;return[m.component(App.headerVC,n),n.State?m.component(App.ResultsVC,e):m.component(App.settingsVC,n)]}},m.mount(document.body,App.SuperVC);