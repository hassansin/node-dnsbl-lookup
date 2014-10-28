var lookup = require('./index.js');

describe('DNSBL IPv4', function(){
  it('should work', function(done){
    var dnsbl = new lookup.dnsbl('58.97.142.25');
    dnsbl.on('error',function(err,bl){     	  
    	console.log(err,bl);
    });
    dnsbl.on('data',function(response,bl){
    	console.log(response);    	
    });
    dnsbl.on('done', function(){      
      done();
    });    
  });
});

describe('DNSBL IPv6', function(){
  it('should work', function(done){
    var list = require('./list/dnsbl_v6_list');
    var dnsbl = new lookup.dnsbl('2a01:4f8:140:4222::2',1,list);
    dnsbl.on('error',function(err,bl){        
      console.log(err,bl);
    });
    dnsbl.on('data',function(response,bl){
      console.log(response);      
    });
    dnsbl.on('done', function(){      
      done();
    });    
  });
});


describe('URIBL', function(){
  it('should pass', function(done){
    var uribl = new lookup.uribl('winning.email');
    uribl.on('error',function(err,bl){        
      console.log(err);
    });
    uribl.on('data',function(response,bl){
      console.log(response);      
    });
    uribl.on('done', function(){      
      done();
    });    
  });
});