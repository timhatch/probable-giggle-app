var App=App||{};App.RouteResult={params:{},data:[],fetch:function(t){return this.params=t,m.request({method:"GET",url:"/results/route",data:t}).then(function(e){try{this.data=e.map(function(e){var n=new App.PersonResult(e.start_order);return n.params=Object.assign({start_order:e.start_order},t),n.data=e,n.objectifyResults(),n})}catch(n){window.console.log(n)}}.bind(this))},updateResults:function(){var t=this.params;return m.request({method:"GET",url:"/results/route",data:t}).then(function(t){try{t.forEach(function(t){this.data.find(function(e){return e.data.per_id===t.per_id}).update(t)}.bind(this))}catch(e){window.console.log(e)}}.bind(this))},save:function(){}};var App=App||{};App.SettingsVC={view:function(t,e){return m("div#settings",[m("header",{className:App.connectionStatus()?"connected":"disconnected"},e.ss.comp.title||m.trust("&nbsp;")),m.component(App.ParamSV,{vm:e,key:"WetId",text:"competition"}),m.component(App.ParamSV,{vm:e,key:"Route",text:"round"}),m.component(App.ParamSV,{vm:e,key:"GrpId",text:"category"})])}},App.ParamSV={controller:function(t){this.set=function(e){switch(t.vm.ss[t.key]=e.toUpperCase()||null,t.key){case"WetId":t.vm.fetchCompetition();break;case"GrpId":t.vm.fetch();break;default:App.sessionStorage.set("o-appstate",t.vm.ss)}}},view:function(t,e){return m("span.modal",[m("label",e.text),m("input[type=text]",{onchange:m.withAttr("value",t.set.bind(t)),pattern:e.pattern||null,value:e.vm.ss[e.key]||m.trust("")})])}};var App=App||{};App.TableViewController={controller:function(){this["delete"]=function(){alert("starter deletion not yet implemented")},this.sorts=function(t){return{onclick:function(e){var n=e.target.getAttribute("data-sort-by");if(n){var r=t[0];t.sort(function(t,e){return t.data[n]>e.data[n]?1:t.data[n]<e.data[n]?-1:0}),r===t[0]&&t.reverse()}}}}},view:function(t,e){var n=e.vm.rd.data,r=e.vm.blocs;return m("table",t.sorts(n),[App[e.type].createHeaderRow(r),n.map(function(n){var r={vm:e.vm,person:n};return App[e.type].createContentRow(t,r)})])}},App.Results={createHeaderRow:function(t){return m("tr",[m("th[data-sort-by=result_rank]","Rk"),m("th[data-sort-by=lastname].w12.left","Lastname"),m("th[data-sort-by=firstname].w09.left","Firstname"),m("th[data-sort-by=nation]","IOC "),m("th[data-sort-by=start_order]","Sn "),m("th.w45.flex",[t.map(function(t){return m(".bloc",m.trust("p"+t))})]),m("th.w09","Result"),m("th.w03")])},createContentRow:function(t,e){var n=e.vm,r=e.person.data;return m("tr",{id:r.per_id},[m("td",r.result_rank||m.trust(""),{result_rank:r.result_rank}),m("td.w12.left",r.lastname),m("td.w09.left",r.firstname),m("td",r.nation),m("td",r.start_order),m("td.w45.flex",[n.blocs.map(function(t){var s="p"+t,a=e.person;return m(".bloc",{key:r.per_id+"."+t},[m.component(this.AttemptsSubView,{vm:n,person:a,id:s,datatype:"b"}),m.component(this.AttemptsSubView,{vm:n,person:a,id:s,datatype:"t"})])}.bind(this))]),m("td.w09",r.result)])},AttemptsSubView:{controller:function(t){this.responseStatus=m.prop(!0),this.getPropertyValue=function(e,n){var r=t.person.data.result_json;return r[e]?r[e][n]:null},this.set=function(e){var n,r,s,a=t.person.data.result_json;a[t.id]||(a[t.id]={a:0}),n=parseInt(e,10),n=isNaN(n)?null:n,a[t.id][t.datatype]=this.prop=n,a[t.id].a=Math.max(a[t.id].a,this.prop),r=t.person.stringifySingleResult(t.id),s=t.person.save(r),s.then(function(){t.vm.rd.updateResults(),this.responseStatus(!0)}.bind(this)).then(null,function(){this.responseStatus(!1)}.bind(this))}},view:function(t,e){var n=e.person.data,r=t.getPropertyValue(e.id,e.datatype);return m("input[type=text]",{key:n.per_id+"."+e.id+e.datatype,placeholder:e.datatype,value:isNaN(r)?m.trust(""):r,className:t.responseStatus()?"connected":"disconnected",onchange:m.withAttr("value",t.set.bind(t))})}}},App.Starters={createHeaderRow:function(){return m("tr",[m("th[data-sort-by=start_order]","Sn"),m("th[data-sort-by=lastname].w12.left","Lastname"),m("th[data-sort-by=firstname].w09.left","Firstname"),m("th[data-sort-by=nation]","IOC"),m("th[data-sort-by=per_id]","ID"),m("th[data-sort-by=rank_prev_heat]","Prev Heat"),m("th",m.trust(""))])},createContentRow:function(t,e){var n=e.person,r=e.person.data;return m("tr",[m("td",r.start_order),m("td.w12.left",r.lastname),m("td.w09.left",r.firstname),m("td",r.nation),m("td",r.per_id),m("td",r.rank_prev_heat||m.trust("NA")),m("td",[m("button[outline=true].icon-trash-empty",{onclick:t["delete"].bind(n)})])])}},App.Scores={createHeaderRow:function(){return m("tr",[m("th[data-sort-by=start_order]","Sn"),m("th.w12.left","Lastname"),m("th.w09.left","Firstname"),m("th","IOC"),m("th.w48","Score"),m("th.w09","Result")])},createContentRow:function(t,e){var n=e.person.data;return m("tr",[m("td",n.start_order),m("td.w12.left",n.lastname),m("td.w09.left",n.firstname),m("td",n.nation),m("td.w48"),m("td.w09")])}};var App=App||{};App.PersonResult=function(t){this.id=t,this.params={},this.data={}},App.PersonResult.prototype={fetch:function(t){return this.params=t,m.request({method:"GET",url:"/results/person",data:t}).then(function(t){this.data=t,this.objectifyResults()}.bind(this))},update:function(t){this.data.result=t.result,this.data.result_rank=t.result_rank,this.data.sort_values=t.sort_values,this.data.result_json=t.result_json,this.objectifyResults()},objectifyResults:function(){var t=this.data.result_json;try{var e=JSON.parse(t),n,r;for(var s in e){var a={a:null,b:null,t:null};for(var o in a)n=o+"[0-9]{1,}",r=e[s].match(n),a[o]=r?parseInt(r[0].slice(1),10):null;e[s]=a}this.data.result_json=e}catch(i){window.console.log(i)}},stringifySingleResult:function(t){var e=this.data.result_json[t],n={},r="";for(var s in e)null!==e[s]&&(r+=s+e[s]);return n[t]=r,JSON.stringify(n)},save:function(t){var e=this.params;return e.result_json=t,m.request({method:"PUT",url:"/results/person",data:e})}};var App=App||{};App.VM=function(t,e){return{ss:e,rd:t,blocs:[1,2,3,4],params:{},composeURLParams:function(){var t={Q:0,S:2,F:3},n={M:6,F:5,MJ:84,FJ:81,MA:82,FA:79,MB:83,FB:80};return{wet_id:parseInt(e.WetId,10)||0,route:t[e.Route]||0,grp_id:n[e.GrpId]||1}},fetch:function(t){var e=this.composeURLParams(t),n=this.rd.fetch(e);n.then(function(){App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})},fetchCompetition:function(){var t=this.ss.WetId;m.request({method:"GET",url:"/competition",data:{wet_id:t}}).then(function(t){try{this.ss.comp=t,App.sessionStorage.set("o-appstate",this.ss)}catch(e){window.console.log("invalid response : "+e)}this.reset()}.bind(this)).then(function(){App.connectionStatus(!0)}).then(null,function(){App.connectionStatus(!1)})},reset:function(){}}};var App=App||{};App.connectionStatus=m.prop(!0),App.sessionStorage=mx.storage("session",mx.SESSION_STORAGE),App.SuperVC={view:function(t,e){return[m.component(App.SettingsVC,e.vm),m.component(App.RouterVC),m.component(App.TableViewController,{vm:e.vm,type:e.type})]}},App.RouterVC={view:function(){return m("#routes",[m("a[href='/st']",{config:m.route},"Startlist"),m("a[href='/re']",{config:m.route},"Resultlist"),m("a[href='/sc']",{config:m.route},"Scoresheet")])}},App.init=function(){var t=App.RouteResult,e={WetId:null,Route:null,comp:{title:null}},n=App.sessionStorage.get("o-appstate");n||(n=e,App.sessionStorage.set("o-appstate",e));var r=new App.VM(t,n);m.route.mode="hash",m.route(document.body,"/",{"/st":m.component(App.SuperVC,{vm:r,type:"Starters"}),"/re":m.component(App.SuperVC,{vm:r,type:"Results"}),"/sc":m.component(App.SuperVC,{vm:r,type:"Scores"})})}();