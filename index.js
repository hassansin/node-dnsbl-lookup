'use strict';

const dnsbl_list = require('./list/dnsbl_list'); //source: http://multirbl.valli.org/list/
const dnsbl_v6_list = require('./list/dnsbl_v6_list'); //source: http://multirbl.valli.org/list/
const uribl_list = require('./list/uribl_list'); //source: http://multirbl.valli.org/list/
const LIMIT = 200;
const async = require('async');
const dns = require('dns');
const resolver = new dns.Resolver();
const util = require('util');
const net = require('net');
const events = require('events');

//https://gist.github.com/Mottie/7018157
function expandIPv6Address(address) {
  let fullAddress = '';
  let expandedAddress = '';
  let validGroupCount = 8;
  let validGroupSize = 4;
  let ipv4 = '';
  const extractIpv4 = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/;
  const validateIpv4 = /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;

  // look for embedded ipv4
  if (validateIpv4.test(address)) {
    groups = address.match(extractIpv4);
    for (var i = 1; i < groups.length; i = 1+i) {
      ipv4 += ('00' + (parseInt(groups[i], 10).toString(16))).slice(-2) + (i === 2 ? ':' : '');
    }
    address = address.replace(extractIpv4, ipv4);
  }

  if (address.indexOf('::') === -1) // All eight groups are present.
    fullAddress = address;
  else // Consecutive groups of zeroes have been collapsed with '::'.
  {
    var sides = address.split('::');
    var groupsPresent = 0;
    for (let i = 0; i < sides.length; i = 1 + i) {
      groupsPresent += sides[i].split(':').length;
    }
    fullAddress += sides[0] + ':';
    for (let i = 0; i < validGroupCount - groupsPresent; i = 1 + i) {
      fullAddress += '0000:';
    }
    fullAddress += sides[1];
  }
  var groups = fullAddress.split(':');

  for (let i = 0; i < validGroupCount; i = 1 + i) {
    while (groups[i].length < validGroupSize) {
      groups[i] = '0' + groups[i];
    }
    expandedAddress += (i !== (validGroupCount - 1)) ? groups[i] + ':' : groups[i];
  }
  return expandedAddress;
}

function reverseIP(address) {
  if (net.isIPv4(address)) {
    address = address.split('.').reverse().join('.');
  } else if (net.isIPv6(address)) {
    address = expandIPv6Address(address);
    address = address.split(/:|/).reverse().join('.');
  }
  return address;
}

function do_a_lookup(host, callback) {
  resolver.resolve(host, function (err, addresses) {
    if (err) {
      if (err.code === 'ENOTFOUND') {
        return callback(null, {status: 'not_listed'});
      } else {
        return callback(err, null);
      }
    } else if (addresses) {
      resolver.resolveTxt(host, function (err, records) {
        if (err) {
          return callback(err);
        }
        if (records) {
          return callback(null, {status: 'listed', 'A': addresses.join(' , '), 'TXT': records.join('\n')});
        }
        return callback(null, {status: 'listed', 'A': addresses.join(' , ')});
      });
    } else
      return callback(null, null);
  });
}

function multi_lookup(addresses, list, limit) {
  var root = this;
  addresses = Array.isArray(addresses) ? addresses : [addresses];
  limit = limit || LIMIT;

  async.eachSeries(addresses, function (address, callback_a) {
    var lookup_address = reverseIP(address);
    async.eachLimit(list, limit, function (item, callback_b) {
      var zone = item.zone || item,
        host = lookup_address + '.' + zone;

      do_a_lookup(host, function (err, res) {
        if (err)
          root.emit('error', err, item);
        else {
          res.address = address;
          root.emit('data', res, item);
        }
        callback_b();
      });
    }, function (err) {
      if (err) throw err;
      callback_a(err);
    });
  }, function (err) {
    if (err) throw err;
    root.emit('done');
  });
}

function dnsbl(ip_or_domain, list, limit) {
  var root = this;

  if (net.isIPv4(ip_or_domain)) {
    list = list || dnsbl_list;
    multi_lookup.call(this, ip_or_domain, list, limit);
  } else if (net.isIPv6(ip_or_domain)) {
    list = list || dnsbl_v6_list;
    multi_lookup.call(this, ip_or_domain, list, limit);
  } else {
    resolver.resolve(ip_or_domain, function (err, addresses) {
      if (err) {
        root.emit('error', err);
        root.emit('done');
      } else if (addresses) {
        list = list || dnsbl_list;
        multi_lookup.call(root, addresses, list, limit);
      } else {
        // do nothing, lol :-)
      }
    });
  }
  events.EventEmitter.call(this);
}

function uribl(domain, list, limit) {
  list = list || uribl_list;

  multi_lookup.call(this, domain, list, limit);
  events.EventEmitter.call(this);
}

util.inherits(dnsbl, events.EventEmitter);
util.inherits(uribl, events.EventEmitter);
exports.dnsbl = dnsbl;
exports.uribl = uribl;
exports.reverseIP = reverseIP;
exports.setServers = function (arrayOfDnsServersToUse) { // https://nodejs.org/api/dns.html#dns_dns_setservers_servers
  resolver.setServers(arrayOfDnsServersToUse);
};