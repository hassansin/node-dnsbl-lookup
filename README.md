## Node.js DNSBLs Lookup
Supports IPv4, IPv6 and Domain lookup. Works from command-line.
### Installation
    npm install dnsbl-lookup -g
    var lookup = require('dnsbl-lookup'); // inside module
    
    
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

Command-line:
     
    $ dnsbl-lookup 58.97.142.25
    $ dnsbl-lookup 2a01:4f8:140:4222::2
    $ dnsbl-lookup gmail.com list.txt // list.txt is line-separated dns zones 

_see more examples in test.js_

   Responses:

    { address:'58.97.142.25', status: 'not_listed' }
    
    { 
      address: '58.97.142.25',
      status: 'listed',
      A: '127.0.0.2',
      TXT: 'Blocked - see http://cbl.abuseat.org/lookup.cgi?ip=58.97.142.25' 
    }