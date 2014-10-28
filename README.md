## Node.js DNSBLs Lookup
supports IPv4, IPv6 and Domain lookup
### Installation
    npm install dnsbl-lookup
    var lookup = require('dnsbl-lookup');
    
### Examples
DNSBL Lookup:

    var dnsbl = new lookup.dnsbl(ip_or_domain, [dnsbl_list] ,[limit]);

    dnsbl.on('error',function(err,bl){ ... });
    dnsbl.on('data',function(response,bl){ ... });
    dnsbl.on('done', function(){ ... });  

URIBL Lookup:

    var uribl= new lookup.uribl(domain, [uribl_list] ,[limit]);

    uribl.on('error',function(err,bl){ ... });
    uribl.on('data',function(response,bl){ ... });
    uribl.on('done', function(){ ... });  

_see more examples in test.js_

   responses:

    { status: 'not_listed' }
    
    { status: 'listed',
      A: '127.0.0.2',
      TXT: 'Blocked - see http://cbl.abuseat.org/lookup.cgi?ip=58.97.142.25' 
    }