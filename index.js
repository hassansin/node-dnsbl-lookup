var dnsbl_list = require('./dnsbl_list');
var async = require('async'), dns = require('dns'),util = require('util'),events = require("events");

function is_ip(str){
    if (/^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/.test(str)) {      
        return true;
    }
    return false;
};

function do_dns_lookup(address,dnsbl_zone,callback){
  var host = address.split('.').reverse().join('.')+'.'+dnsbl_zone;   
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
      })          
    }      
    else  
      return callback(null,null);             
  });
};

function multi_lookup(address,list,limit){
  var root = this;  
  async.eachLimit(list,limit,function(item,callback){
    do_dns_lookup(address,item.zone,function(err,res){
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

function dnsbl(ip_or_domain,list,limit){ 
  var root = this; 
  var address = '';
  if(!list){
    list = dnsbl_list;
  }  
  if(!limit){
    limit = 20;
  }
  events.EventEmitter.call(this);
  if(is_ip(ip_or_domain)){
    address = ip_or_domain;
    multi_lookup.call(this,address,list,limit);
  }  
  else{
    dns.resolve(ip_or_domain,function(err,addresses){        
      if(err){
        root.emit('error',err);
      }
      else if(addresses){
        address = addresses[0];
        multi_lookup.call(root,address,list,limit);
      }
      else {

      }
    })
  }  
};

util.inherits(dnsbl, events.EventEmitter);

exports.dnsbl = dnsbl;