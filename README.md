# Node.js DNSBLs Lookup

    npm install node-dnsbl-lookup
    
### Examples
    var lookup = require('node-dnsbl-lookup');

    var dnsbl = new lookup.dnsbl(ip_or_domain, [dnsbl_list] ,[limit]);

    dnsbl.on('error',function(err,bl){ ... });
    dnsbl.on('data',function(response,bl){ ... });
    dnsbl.on('done', function(){ ... });  

   responses:

    { status: 'not_listed' }
    
    { status: 'listed',
      A: '127.0.0.2',
      TXT: 'Blocked - see http://cbl.abuseat.org/lookup.cgi?ip=58.97.142.25' 
    }