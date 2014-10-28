var dnsbl_list = require('./list/dnsbl_list'), //source: http://multirbl.valli.org/list/
  dnsbl_v6_list = require('./list/dnsbl_v6_list'), //source: http://multirbl.valli.org/list/
  uribl_list = require('./list/uribl_list'), //source: http://multirbl.valli.org/list/
  LIMIT = 20,
  async = require('async'), 
  dns = require('dns'),
  util = require('util'),
  events = require("events");

function isIPv4(str) {
    if (/^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(str)) {  
        return true;
    }
    return false;
};
function isIPv6(str) {
    if (/^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/.test(str)) {
        return true;
    }
    return false;
};
function isIP(str) {
    if (isIPv4(str)) {
        return 4;
    } else if (isIPv6(str)) {
        return 6;
    } else {
        return 0;
    }
};
//https://gist.github.com/Mottie/7018157
function expandIPv6Address(address)
{
    var fullAddress = "";
    var expandedAddress = "";
    var validGroupCount = 8;
    var validGroupSize = 4;
 
    var ipv4 = "";
    var extractIpv4 = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/;
    var validateIpv4 = /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;
 
    // look for embedded ipv4
    if(validateIpv4.test(address))
    {
        groups = address.match(extractIpv4);
        for(var i=1; i<groups.length; i++)
        {
            ipv4 += ("00" + (parseInt(groups[i], 10).toString(16)) ).slice(-2) + ( i==2 ? ":" : "" );
        }
        address = address.replace(extractIpv4, ipv4);
    }
 
    if(address.indexOf("::") == -1) // All eight groups are present.
        fullAddress = address;
    else // Consecutive groups of zeroes have been collapsed with "::".
    {
        var sides = address.split("::");
        var groupsPresent = 0;
        for(var i=0; i<sides.length; i++)
        {
            groupsPresent += sides[i].split(":").length;
        }
        fullAddress += sides[0] + ":";
        for(var i=0; i<validGroupCount-groupsPresent; i++)
        {
            fullAddress += "0000:";
        }
        fullAddress += sides[1];
    }
    var groups = fullAddress.split(":");
    for(var i=0; i<validGroupCount; i++)
    {
        while(groups[i].length < validGroupSize)
        {
            groups[i] = "0" + groups[i];
        }
        expandedAddress += (i!=validGroupCount-1) ? groups[i] + ":" : groups[i];
    }
    return expandedAddress;
}

function do_a_lookup(host,callback){    
  dns.resolve(host,function(err,addresses){              
    if (err) {    
      if(err.code==='ENOTFOUND' ){
        return callback(null,{status:'not_listed'});
      }
      else{
        return callback(err,null);
      }          
    } 
    else if(addresses){      
      dns.resolveTxt(host,function(err,addresses2){           
        if(addresses2){
          return callback(null,{status:'listed', 'A':addresses.join(' , '), 'TXT':addresses2.join("\n")});
        }
        return callback(null,{status:'listed', 'A':addresses.join(' , ')});
      });          
    }      
    else  
      return callback(null,null);             
  });
};

function multi_lookup(address,list,limit){
  var root = this;  
  async.eachLimit(list,limit,function(item,callback){
    var zone = item.zone || item,
      host = address+ '.' + zone; 

    do_a_lookup(host,function(err,res){
      if(err)
        root.emit('error',err,item);
      else{        
        root.emit('data',res,item);
      }        
      callback();
    });
  },function(err){
    root.emit('done');
  })
};

function dnsbl(ip_or_domain,limit,list){ 
  var root = this; 
  var address = '';  
  limit = limit || 10;  
    
  if(isIPv4(ip_or_domain)){
    address = ip_or_domain.split('.').reverse().join('.');
    list = list || dnsbl_list;
    multi_lookup.call(this,address,list,limit);
  }  
  else if(isIPv6(ip_or_domain)){
    address = expandIPv6Address(ip_or_domain);
    address = address.split(/:|/).reverse().join('.');    
    list = list || dnsbl_v6_list;
    multi_lookup.call(this,address,list,limit);
  }
  else{
    dns.resolve(ip_or_domain,function(err,addresses){        
      if(err){
        root.emit('error',err);
      }
      else if(addresses){
        address = addresses[0].split('.').reverse().join('.');
        multi_lookup.call(root,address,list,limit);
      }
      else {

      }
    })
  }  
  events.EventEmitter.call(this);
};

function uribl(domain,limit,list){
  list = list || uribl_list;
  limit = limit || 10;

  multi_lookup.call(this,domain,list,limit);
  events.EventEmitter.call(this);
};

util.inherits(dnsbl, events.EventEmitter);
util.inherits(uribl,events.EventEmitter);
exports.dnsbl = dnsbl;
exports.uribl = uribl;
exports.isIP = isIP;