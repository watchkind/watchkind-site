(function(){
  "use strict";
  var ATTR_KEY="wk_attribution_v1";
  var VISITOR_KEY="wk_visitor_id_v1";
  var SESSION_KEY="wk_session_id_v1";
  var QUEUE_KEY="wk_event_queue_v1";
  var PARAMS=["ref","utm_source","utm_medium","utm_campaign","utm_content","utm_term"];

  function safeParse(value,fallback){try{return JSON.parse(value)}catch(e){return fallback}}
  function id(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
    return "wk_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2);
  }
  function getOrCreate(storage,key){
    var value=storage.getItem(key);
    if(!value){value=id();storage.setItem(key,value)}
    return value;
  }
  function queryAttribution(){
    var q=new URLSearchParams(location.search), out={}, found=false;
    PARAMS.forEach(function(k){var v=q.get(k);if(v){out[k]=v;found=true}});
    return found?out:null;
  }
  function touch(){
    var incoming=queryAttribution();
    var saved=safeParse(localStorage.getItem(ATTR_KEY),null);
    if(incoming){
      var now=new Date().toISOString();
      if(!saved||!saved.first){
        saved={first:Object.assign({},incoming,{landing_path:location.pathname,captured_at:now})};
      }
      saved.last=Object.assign({},incoming,{landing_path:location.pathname,captured_at:now});
      localStorage.setItem(ATTR_KEY,JSON.stringify(saved));
    }
    return saved;
  }
  function attribution(){return safeParse(localStorage.getItem(ATTR_KEY),{})||{}}
  function currentProps(){
    var a=attribution();
    return {
      visitor_id:getOrCreate(localStorage,VISITOR_KEY),
      session_id:getOrCreate(sessionStorage,SESSION_KEY),
      ref:(a.last&&a.last.ref)||(a.first&&a.first.ref)||null,
      utm_source:(a.last&&a.last.utm_source)||(a.first&&a.first.utm_source)||null,
      utm_medium:(a.last&&a.last.utm_medium)||(a.first&&a.first.utm_medium)||null,
      utm_campaign:(a.last&&a.last.utm_campaign)||(a.first&&a.first.utm_campaign)||null,
      first_ref:(a.first&&a.first.ref)||null,
      first_utm_source:(a.first&&a.first.utm_source)||null,
      landing_path:(a.first&&a.first.landing_path)||location.pathname
    };
  }
  function queue(event){
    var q=safeParse(localStorage.getItem(QUEUE_KEY),[])||[];
    q.push(event);
    if(q.length>100)q=q.slice(q.length-100);
    localStorage.setItem(QUEUE_KEY,JSON.stringify(q));
  }
  function capture(name,properties){
    touch();
    var payload={
      event:name,
      timestamp:new Date().toISOString(),
      path:location.pathname,
      page:document.title,
      referrer:document.referrer||null,
      properties:Object.assign({},currentProps(),properties||{})
    };
    queue(payload);
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:name},payload.properties));
    document.dispatchEvent(new CustomEvent("watchkind:event",{detail:payload}));

    var endpoint=window.WK_ANALYTICS_ENDPOINT||document.documentElement.getAttribute("data-analytics-endpoint");
    if(endpoint){
      try{
        var body=JSON.stringify(payload);
        if(navigator.sendBeacon){navigator.sendBeacon(endpoint,new Blob([body],{type:"application/json"}))}
        else{fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:body,keepalive:true}).catch(function(){})}
      }catch(e){}
    }
    return payload;
  }
  function carry(url){
    touch();
    var a=attribution(), src=a.last||a.first||{}, u=new URL(url,location.origin);
    PARAMS.forEach(function(k){if(src[k]&&!u.searchParams.has(k))u.searchParams.set(k,src[k])});
    return u.pathname+u.search+u.hash;
  }
  function cleanShareUrl(){
    return location.origin+location.pathname;
  }
  async function share(title,text){
    var url=cleanShareUrl();
    capture("share_watch",{share_url:url});
    if(navigator.share){
      try{await navigator.share({title:title,text:text,url:url});return "shared"}catch(e){if(e&&e.name==="AbortError")return "cancelled"}
    }
    try{await navigator.clipboard.writeText(url);return "copied"}catch(e){return "failed"}
  }

  touch();
  window.WatchkindTracking={
    capture:capture,
    attribution:attribution,
    carry:carry,
    share:share,
    cleanShareUrl:cleanShareUrl,
    queuedEvents:function(){return safeParse(localStorage.getItem(QUEUE_KEY),[])||[]}
  };
})();