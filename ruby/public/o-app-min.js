var App=App||{};App.RouteResult={params:{},data:[],fetch:function(t){return this.params=t,m.request({method:"GET",url:"/results/route",data:t}).then(function(e){try{this.data=e.map(function(e){var s=new App.PersonResult(e.start_order);return s.params=Object.assign({start_order:e.start_order},t),s.data=e,s.data.result_json=s.objectifyResults(e.result_json),s})}catch(s){window.console.log(s)}}.bind(this))},save:function(t){var e=this.params;return e.result_json=t,m.request({method:"PUT",url:"/results/route",data:e})}};var App=App||{};App.SettingsVC={controller:function(t){this.ss=t.ss,this.fetchCompetitionParams=function(){m.request({method:"GET",url:"/competition",data:{wet_id:t.ss.WetId}}).then(function(e){try{t.ss.comp=e,App.sessionStorage.set("o-appstate",t.ss)}catch(s){window.console.log("invalid response : "+s)}t.reset()}).then(function(){App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})},this.fetchResultList=function(){t.fetch(null)}},view:function(t){return m("div#settings",[m("header",{className:App.connectionStatus()?"connected":"disconnected"},m("span.details",t.ss.comp.title||m.trust("&nbsp;"))),m.component(App.ParamSV,t,{key:"WetId",text:"competition",pattern:"[0-9]"}),m.component(App.ParamSV,t,{key:"Route",text:"round"}),m.component(App.ParamSV,t,{key:"GrpId",text:"category"})])}},App.ParamSV={controller:function(t,e){this.params=e,this.ss=t.ss,this.set=function(s){switch(t.ss[e.key]=s.toUpperCase()||null,e.key){case"WetId":t.fetchCompetitionParams();break;case"GrpId":t.fetchResultList();break;default:App.sessionStorage.set("o-appstate",t.ss)}}},view:function(t){return m("div.modal",[m("input[type=text]",{placeholder:t.params.text,onchange:m.withAttr("value",t.set.bind(t)),pattern:t.params.pattern||null,value:t.ss[t.params.key]||m.trust("")})])}};var App=App||{};App.TableViewController={controller:function(t){this.model=t.model,this.blocs=t.blocs,this.save=function(){},this.sorts=function(){var t=this.model.data;return{onclick:function(e){var s=e.target.getAttribute("data-sort-by");if(s){window.console.log(s);var n=t[0];t.sort(function(t,e){return window.console.log(t[s]),t[s]>e[s]?1:t[s]<e[s]?-1:0}),n===t[0]&&t.reverse()}}}}},view:function(t){return m("table",t.sorts(),[m.component(App.HeaderRow),t.model.data.map(function(e){return e=e.data,m("tr",[m("td",e.result_rank||m.trust(""),{result_rank:e.result_rank}),m("td",e.lastname),m("td",e.firstname),m("td",e.nation),m("td",e.start_order),m("td",e.per_id),m("td",[t.blocs.map(function(t){var s="p"+t;return window.console.log(s),[m("span",s),m.component(App.AttemptsView,{person:e,id:s,datatype:"b"}),m.component(App.AttemptsView,{person:e,id:s,datatype:"t"})]})]),m("td",e.result),m("td",[m("button",{onclick:t.save.bind(t)},"Save")])])})])}},App.ResultsVC={controller:function(t){this.model=t.model,this.blocs=t.blocs,window.console.log(this.model),this.save=function(){}},view:function(t){var e=t.model.data;return m("tr",[m("td",e.result_rank||m.trust(""),{result_rank:e.result_rank}),m("td",e.lastname),m("td",e.firstname),m("td",e.nation),m("td",e.start_order),m("td",e.per_id),m("td",[t.blocs.map(function(t){var s="p"+t;return[m("span",s),m.component(App.AttemptsView,{person:e,id:s,datatype:"b"}),m.component(App.AttemptsView,{person:e,id:s,datatype:"t"})]})]),m("td",e.result),m("td",[m("button",{onclick:t.save.bind(t)},"Save")])])}},App.AttemptsView={controller:function(t){window.console.log(t),this.result=t.person.result_json,this.id=t.id,this.text=t.datatype,this.prop=this.result[t.id]?this.result[t.id][t.datatype]:null,this.set=function(e){this.result[t.id]||(this.result[t.id]={a:0}),this.result[t.id][t.datatype]=this.prop=parseInt(e,10)||null,this.result[t.id].a=Math.max(this.result[t.id].a,this.prop)}},view:function(t){return m("input[type=text]",{placeholder:t.text,value:t.prop||m.trust(""),onchange:m.withAttr("value",t.set.bind(t))})}},App.HeaderRow={view:function(){return m("tr",[m("th[data-sort-by=result_rank]","Rank"),m("th[data-sort-by=lastname]","Lastname"),m("th[data-sort-by=firstname]","Firstname"),m("th[data-sort-by=nation]","Nation"),m("th[data-sort-by=start_order]","Start Nr"),m("th[data-sort-by=per_id]","UUID"),m("th","Scores"),m("th","Result"),m("th",m.trust(""))])}};var App=App||{};App.PersonResult=function(t){this.id=t,this.params={},this.data={}},App.PersonResult.prototype={fetch:function(t){return this.params=t,m.request({method:"GET",url:"/results/person",data:t}).then(function(t){this.data=t}.bind(this))},objectifyResults:function(t){try{var e=JSON.parse(t),s,n;for(var r in e){var a={a:null,b:null,t:null};for(var o in a)s=o+"[0-9]{1,}",n=e[r].match(s),a[o]=n?parseInt(n[0].slice(1),10):null;e[r]=a}return e}catch(i){window.console.log(i)}},stringifyResults:function(t){var e={};for(var s in t){var n=t[s],r="";e[s]=s;for(var a in n)n[a]&&(r+=a+n[a]);e[s]=r}return e},save:function(t){var e=this.params;return e.result_json=t,window.console.log(e),m.request({method:"PUT",url:"/results/person",data:e})}};var App=App||{};App.BoulderResultVM=function(t){this.id="p"+t,this.result={a:null,b:null,c:null},this.displayResult=""},App.BoulderResultVM.prototype={parse:function(t){var e=t.match("t[0-9]{1,}")||null,s=t.match("b[0-9]{1,}")||null,n=t.match("a[0-9]{1,}")||null;this.result.a=n?parseInt(n[0].slice(1),10):null,this.result.b=s?parseInt(s[0].slice(1),10):null,this.result.t=e?parseInt(e[0].slice(1),10):null,this.setResultString()},update:function(t){switch(t){case"b":this.result.t=0,this.result.a=this.result.a||3,this.result.b=this.result.b||3;break;case"1":case"2":case"3":this.result.b=this.result.b||parseInt(t,10),this.result.t=this.result.a=parseInt(t,10);break;default:this.result.t=this.result.b=this.result.a=0}this.setResultString()},setResultString:function(){var t=this.result.t?"t"+this.result.t:"",e=this.result.b?"b"+this.result.b:"",s=this.result.a?"a"+this.result.a:"";this.displayResult=t+(e[0]||""),this.resultString=s+e+t}};var App=App||{};App.VM=function(t,e){return{ss:e,rd:t,params:{},composeURLParams:function(t){var s={Q:0,S:2,F:3},n={M:6,F:5,MJ:84,FJ:81,MA:82,FA:79,MB:83,FB:80};return{wet_id:parseInt(e.WetId,10)||0,route:s[e.Route]||0,grp_id:n[e.GrpId]||1}},fetch:function(t){var e=this.composeURLParams(t),s=this.rd.fetch(e);s.then(function(){App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})},save:function(){var e=[],s;e=this.rd.data.map(function(t){return{start_order:t.data.start_order,result_json:JSON.stringify(t.stringifyResults(t.data.result_json))}}),s=t.save(e),s.then(function(){App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})},reset:function(){}}};var App=App||{};App.connectionStatus=m.prop(!0),App.sessionStorage=mx.storage("session",mx.SESSION_STORAGE),App.SuperVC={controller:function(){var t={WetId:null,Route:null,GrpId:null,comp:{title:null}};this.list=[{testname:"John",firstname:"John",lastname:"Jones"},{testname:"Eddie",firstname:"Eddie",lastname:"Smith"}],this.ss=App.sessionStorage.get("o-appstate"),this.ss||(this.ss=t,App.sessionStorage.set("o-appstate",t)),this.model=App.RouteResult,this.vm=new App.VM(this.model,this.ss),this.sorts=function(){var t=this.list;return{onclick:function(e){var s=e.target.getAttribute("data-sort-by");if(s){var n=t[0];t.sort(function(t,e){return t[s]>e[s]?1:t[s]<e[s]?-1:0}),n===t[0]&&t.reverse()}}}},this.sorts2=function(){var t=this.model.data;return{onclick:function(e){var s=e.target.getAttribute("data-sort-by");if(s){window.console.log(s);var n=t[0];t.sort(function(t,e){return window.console.log(t[s]),t[s]>e[s]?1:t[s]<e[s]?-1:0}),n===t[0]&&t.reverse()}}}}},view:function(t){var e=t.vm,s=[1,2,3,4,5];return[m.component(App.SettingsVC,e),m.component(App.TableViewController,{model:t.model,blocs:s}),m("button",{onclick:e.save.bind(e)},"Save All")]}},App.TestFunction=function(t){return m("tr",[m("td",t.testname,{firstname:t.firstname}),m("td",t.lastname)])},App.TestContentRow={controller:function(t){this.person=t.model},view:function(t){var e=t.person;return m("tr",[m("td",e.testname,{firstname:e.firstname}),m("td",e.lastname)])}},App.TestHeaderRow={view:function(){return m("tr",[m("th[data-sort-by=firstname]","Firstname"),m("th[data-sort-by=lastname]","Lastname")])}},m.mount(document.body,App.SuperVC);