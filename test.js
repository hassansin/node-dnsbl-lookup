var lookup = require('./index.js');

describe('DNSBL', function(){
  it('should pass', function(done){
    var dnsbl = new lookup.dnsbl('58.97.142.25');
    dnsbl.on('error',function(err,bl){     	  
    	console.log(err);
    });
    dnsbl.on('data',function(response,bl){
    	console.log(response);    	
    });
    dnsbl.on('done', function(){      
      done();
    });    
  })
})